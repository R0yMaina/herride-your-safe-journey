import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly loading?: boolean;
}

export function ConfirmButton({ loading, className, children, disabled, ...rest }: ConfirmButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink font-display text-base text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}