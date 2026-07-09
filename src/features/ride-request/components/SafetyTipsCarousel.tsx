import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/common";
import { SAFETY_TIPS } from "../data/safety-tips";

export function SafetyTipsCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SAFETY_TIPS.length), 4200);
    return () => clearInterval(id);
  }, []);
  const tip = SAFETY_TIPS[index];
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-primary">
        <ShieldCheck className="h-3.5 w-3.5" /> Safety tip
      </div>
      <div className="relative mt-2 min-h-[64px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p className="font-display text-sm text-foreground">{tip.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{tip.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {SAFETY_TIPS.map((t, i) => (
          <span
            key={t.id}
            className={
              "h-1 flex-1 rounded-full transition-colors " +
              (i === index ? "bg-primary" : "bg-white/10")
            }
          />
        ))}
      </div>
    </GlassCard>
  );
}