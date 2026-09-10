import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PROBLEM_SOLUTIONS } from "../../data/problems";
import { FT_ROUTES } from "../../data/site";

/**
 * Problem → solution, as something you operate rather than read.
 *
 * Desktop gets a selectable list with a detail panel; small screens get the
 * same content as an accordion, because a two-column pattern squeezed into
 * 375px is worse than a list. One piece of state drives both. The visible
 * desktop panel duplicates the accordion panel's content, so it is hidden
 * from assistive technology and the accordion carries the semantics.
 */
export function ProblemSolutionExplorer() {
  const [activeId, setActiveId] = useState(PROBLEM_SOLUTIONS[0].id);
  const active = PROBLEM_SOLUTIONS.find((item) => item.id === activeId) ?? PROBLEM_SOLUTIONS[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
      <ul className="divide-y divide-ft-line border-y border-ft-line">
        {PROBLEM_SOLUTIONS.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                aria-expanded={isActive}
                aria-controls={`ft-solution-${item.id}`}
                className="group flex w-full items-start gap-4 py-6 text-left"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-2.5 h-px shrink-0 bg-ft-gold transition-all duration-300",
                    isActive ? "w-8" : "w-3 group-hover:w-6",
                  )}
                />
                <span className="flex-1">
                  <span
                    className={cn(
                      "block text-lg font-semibold leading-snug transition-colors sm:text-xl",
                      isActive ? "text-ft-navy" : "text-ft-navy-soft group-hover:text-ft-navy",
                    )}
                  >
                    “{item.problem}”
                  </span>
                </span>
              </button>

              {/* Accordion panel — the accessible one, small screens only. */}
              <div id={`ft-solution-${item.id}`} className="lg:hidden" hidden={!isActive}>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-7 pl-12">
                        <SolutionBody
                          solution={item.solution}
                          detail={item.detail}
                          serviceId={item.serviceId}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Detail panel — desktop only, decorative duplicate of the above. */}
      <div aria-hidden="true" className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-ft-line bg-ft-cream-deep p-9">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
            The solution
          </span>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <SolutionBody
                solution={active.solution}
                detail={active.detail}
                serviceId={active.serviceId}
                large
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SolutionBody({
  solution,
  detail,
  serviceId,
  large,
}: {
  solution: string;
  detail: string;
  serviceId: string;
  large?: boolean;
}) {
  return (
    <>
      <p className={cn("font-bold leading-snug text-ft-navy", large ? "mt-5 text-2xl" : "text-lg")}>
        {solution}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ft-navy-soft">{detail}</p>
      <Link
        to={FT_ROUTES.services}
        hash={serviceId}
        className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ft-navy"
        tabIndex={large ? -1 : undefined}
      >
        See how we build it
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    </>
  );
}
