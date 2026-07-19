import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ fallback?: ReactNode; children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("boundary.caught", {
      message: error.message,
      stack: info.componentStack ?? undefined,
    });
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <h2 className="font-display text-2xl text-foreground">Something interrupted your ride.</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          We've logged the issue. Please try again in a moment.
        </p>
        <button
          onClick={this.reset}
          className="mt-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }
}
