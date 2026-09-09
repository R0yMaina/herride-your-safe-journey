import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReveal } from "./useReveal";

/**
 * The site's only entrance animation: a short rise and fade, once, when the
 * element reaches the fold. See `useReveal` for why it is not `whileInView`.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`
 * in the root route — framer-motion then applies the end state immediately,
 * so nothing here needs a media query.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span";
}) {
  // The four allowed tags take the same props here; the cast keeps `ref` from
  // being typed as the intersection of all four element types.
  const Component = motion[as] as typeof motion.div;
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <Component
      ref={ref}
      data-ft-reveal=""
      className={className}
      initial={{ opacity: 0, y }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
