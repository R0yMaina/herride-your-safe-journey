import { Eye, EyeOff, Lock } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { FormField } from "./FormField";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label = "Password", error, hint, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <FormField
        {...props}
        ref={ref}
        label={label}
        error={error}
        hint={hint}
        type={visible ? "text" : "password"}
        leading={<Lock className="h-4 w-4" />}
        trailing={
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";
