import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { GlassCard } from "@/components/common";

interface PinPromptSheetProps {
  readonly busy?: boolean;
  readonly onSubmit: (pin: string) => void;
  readonly onClose: () => void;
}

/**
 * HerShield pickup PIN entry: the driver types the 4-digit code her rider
 * reads out. Four one-digit boxes, auto-advance, submit on the last digit.
 */
export function PinPromptSheet({ busy, onSubmit, onClose }: PinPromptSheetProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 3) refs.current[index + 1]?.focus();
    if (digit && index === 3 && next.every(Boolean)) onSubmit(next.join(""));
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[2000] grid place-items-center bg-background/80 p-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GlassCard className="w-full max-w-sm space-y-5 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="ml-auto block p-1 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-lg text-foreground">Ask your rider for her PIN</p>
          <p className="text-sm text-muted-foreground">
            She has a 4-digit code on her trip screen. The trip can only start with it.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={digit}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              autoFocus={i === 0}
              disabled={busy}
              aria-label={`PIN digit ${i + 1}`}
              className="h-14 w-12 rounded-2xl border border-border/70 bg-card/60 text-center font-display text-2xl text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Wrong rider, wrong car, or feeling unsafe? Cancel and report — never start the trip.
        </p>
      </GlassCard>
    </motion.div>
  );
}
