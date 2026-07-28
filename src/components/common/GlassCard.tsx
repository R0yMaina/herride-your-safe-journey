import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Premium glassmorphic surface used across features. */
export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft backdrop-blur-xl",
        // A violet wash across every surface — this is what makes the pairing
        // read as purple-and-white rather than plain white on white.
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-primary/[0.07] before:to-transparent",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
