import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";

/**
 * Single composition root for cross-cutting providers.
 * Route trees consume this once — features never nest providers.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}