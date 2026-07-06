import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenWrapperProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly withPadding?: boolean;
}

export function ScreenWrapper({ children, className, withPadding = true }: ScreenWrapperProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "min-h-full w-full",
        withPadding && "pb-32 pt-6",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}