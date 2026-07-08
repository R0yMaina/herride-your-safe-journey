import { motion } from "framer-motion";
import { evaluatePassword } from "@/lib/validation/password";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-destructive/70",
  "bg-destructive/70",
  "bg-amber-400/80",
  "bg-emerald-400/80",
  "bg-primary",
] as const;

export function PasswordStrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const strength = evaluatePassword(value);
  const filled = strength.score + 1;
  const rules: readonly [keyof typeof strength.checks, string][] = [
    ["length", "8+ characters"],
    ["upper", "Uppercase"],
    ["lower", "Lowercase"],
    ["number", "Number"],
    ["symbol", "Symbol"],
  ];
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={cn(
              "h-1 flex-1 origin-left rounded-full",
              i < filled ? BAR_COLORS[strength.score] : "bg-border/60",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Password strength</span>
        <span className="font-medium text-foreground/80">{strength.label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-[11px]">
        {rules.map(([key, label]) => (
          <li
            key={key}
            className={cn(
              "flex items-center gap-1.5",
              strength.checks[key] ? "text-emerald-400/90" : "text-muted-foreground",
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}