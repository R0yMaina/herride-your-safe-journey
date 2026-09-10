import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "../ui";
import { PROCESS_STEPS } from "../../data/process";

/**
 * The seven steps, on a rail that fills as you scroll past it.
 *
 * The rail is decorative: the list underneath is an ordered list and reads
 * correctly with the animation removed.
 */
export function ProcessTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 65%", "end 60%"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const scaleY = useTransform(smooth, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative mt-14 lg:mt-20">
      {/* Rail */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-[0.4375rem] top-2 w-px bg-ft-line sm:left-[calc(4.5rem+0.4375rem)]"
      >
        <motion.div style={{ scaleY }} className="h-full w-px origin-top bg-ft-gold" />
      </div>

      <ol className="space-y-12 sm:space-y-14">
        {PROCESS_STEPS.map((step, index) => (
          <li key={step.number} className="relative">
            <Reveal delay={index * 0.03}>
              <div className="grid gap-x-8 gap-y-3 pl-9 sm:grid-cols-[4.5rem_1fr] sm:pl-0">
                <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-ft-gold-deep sm:pt-1.5">
                  {step.number}
                </span>

                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[0.3rem] size-3.5 rounded-full border-2 border-ft-gold bg-ft-cream sm:left-[4.5rem] sm:top-[0.35rem]"
                />

                <div className="sm:pl-6">
                  <h3 className="text-xl font-bold text-ft-navy sm:text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ft-navy sm:text-base">
                    {step.summary}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ft-navy-soft">
                    {step.detail}
                  </p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
