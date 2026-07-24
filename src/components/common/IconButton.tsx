import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-foreground shadow-soft backdrop-blur-xl transition-transform hover:scale-105 active:scale-95",
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
