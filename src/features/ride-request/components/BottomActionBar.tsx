import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BottomActionBarProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** Sticky action bar above the bottom nav for step CTAs. */
export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4",
        className,
      )}
    >
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-3 shadow-soft backdrop-blur-2xl">
        {children}
      </div>
    </motion.div>
  );
}
