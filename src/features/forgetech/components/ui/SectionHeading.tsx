import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { useReveal } from "./useReveal";

/** The gold hairline that draws itself in above a section label. It is the
 *  site's only recurring ornament, which is what keeps it meaningful. */
export function Rule({ className, onDark }: { className?: string; onDark?: boolean }) {
  const { ref, revealed } = useReveal<HTMLSpanElement>();

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      data-ft-reveal=""
      className={cn("ft-rule w-10 origin-left", onDark && "opacity-90", className)}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: revealed ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

export function Eyebrow({
  children,
  onDark,
  className,
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[0.6875rem] font-semibold uppercase tracking-[0.18em]",
        onDark ? "text-ft-gold" : "text-ft-gold-deep",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  onDark,
  align = "left",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  onDark?: boolean;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <Reveal className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          <Rule onDark={onDark} className={align === "center" ? "hidden sm:block" : undefined} />
          <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <Heading
          className={cn(
            "mt-5 text-balance text-[2rem] font-bold leading-[1.08] sm:text-[2.75rem] lg:text-[3.25rem]",
            onDark ? "text-ft-cream" : "text-ft-navy",
          )}
        >
          {title}
        </Heading>
      </Reveal>
      {lead && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed sm:text-lg",
              align === "center" && "mx-auto",
              onDark ? "text-ft-cream/70" : "text-ft-navy-soft",
            )}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}
