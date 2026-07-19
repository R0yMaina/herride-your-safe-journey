import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly loading?: boolean;
  readonly leading?: ReactNode;
  readonly variant?: "primary" | "ghost";
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, loading, disabled, leading, children, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-gradient-pink text-noir shadow-glow hover:brightness-110 active:scale-[0.99]"
          : "border border-border/70 bg-card/60 text-foreground backdrop-blur-xl hover:bg-card/80",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leading}
      {children}
    </button>
  ),
);
PrimaryButton.displayName = "PrimaryButton";
