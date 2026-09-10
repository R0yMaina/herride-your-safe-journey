import { motion } from "framer-motion";

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.35 + i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/**
 * The hero's visual: an abstract product surface, not an illustration.
 *
 * It is two overlapping panels — a navy application shell behind, a cream
 * card in front — assembled from the same tokens as the rest of the site, so
 * it reads as a product rather than as decoration. Nothing loops; it settles
 * once and stops.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[30rem] lg:max-w-none" aria-hidden="true">
      {/* Back panel — an application shell. */}
      <motion.div
        custom={0}
        variants={rise}
        initial="hidden"
        animate="show"
        className="relative rounded-2xl border border-ft-navy-line/40 bg-ft-navy-deep p-5 shadow-[0_24px_60px_-32px_rgba(15,26,43,0.55)] sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ft-gold" />
            <span className="h-1.5 w-16 rounded-full bg-ft-cream/25" />
          </div>
          <span className="h-1.5 w-8 rounded-full bg-ft-cream/15" />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              custom={i + 1}
              variants={rise}
              initial="hidden"
              animate="show"
              className="rounded-lg border border-ft-cream/10 bg-white/[0.04] p-3"
            >
              <span className="block h-1 w-6 rounded-full bg-ft-cream/25" />
              <span
                className={`mt-3 block h-2 rounded-full ${i === 1 ? "w-10 bg-ft-gold/80" : "w-8 bg-ft-cream/40"}`}
              />
            </motion.div>
          ))}
        </div>

        {/* A single data line that draws itself in — the one moving element. */}
        <div className="mt-5 overflow-hidden rounded-lg border border-ft-cream/10 bg-white/[0.03] p-4 pb-10">
          <svg viewBox="0 0 240 60" className="h-16 w-full" role="presentation">
            <motion.path
              d="M2 48 L46 40 L90 44 L134 24 L178 28 L236 8"
              fill="none"
              stroke="var(--ft-gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.75, duration: 1.1, ease: "easeInOut" }}
            />
            <line
              x1="2"
              y1="56"
              x2="236"
              y2="56"
              stroke="currentColor"
              className="text-ft-cream/10"
            />
          </svg>
        </div>
      </motion.div>

      {/* Front card — a discrete state change, the thing software actually does. */}
      <motion.div
        custom={4}
        variants={rise}
        initial="hidden"
        animate="show"
        className="absolute -bottom-10 -left-2 w-[54%] max-w-[13.5rem] rounded-xl border border-ft-line bg-ft-cream p-4 shadow-[0_18px_40px_-24px_rgba(15,26,43,0.45)] sm:-left-6"
      >
        <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ft-gold-deep">
          Automated
        </span>
        <div className="mt-3 space-y-2">
          <span className="block h-1.5 w-full rounded-full bg-ft-navy/15" />
          <span className="block h-1.5 w-2/3 rounded-full bg-ft-navy/10" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-ft-navy text-[9px] font-bold text-ft-cream">
            ✓
          </span>
          <span className="h-1.5 w-14 rounded-full bg-ft-navy/15" />
        </div>
      </motion.div>
    </div>
  );
}
