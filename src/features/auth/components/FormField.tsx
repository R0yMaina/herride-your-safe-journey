import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, leading, trailing, className, id, ...props }, ref) => {
    const inputId = id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          {label}
        </label>
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border bg-card/60 px-4 py-3 shadow-soft backdrop-blur-xl transition-colors",
            error ? "border-destructive/60" : "border-border/70 focus-within:border-primary/60",
          )}
        >
          {leading && <span className="text-primary">{leading}</span>}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {trailing}
        </div>
        {error ? (
          <p id={`${inputId}-err`} className="text-xs text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
FormField.displayName = "FormField";