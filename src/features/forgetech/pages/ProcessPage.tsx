import { PageHero, Reveal, Section } from "../components/ui";
import { FinalCTA, ProcessTimeline } from "../components/sections";
import { PRINCIPLES } from "../data/principles";

export function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Process"
        title="From idea to launch."
        lead="Seven steps, run in the same order every time. You always know which one we are in, what comes next, and what we need from you to get there."
      />

      <Section>
        <ProcessTimeline />
      </Section>

      <Section tone="cream-deep" bordered>
        <h2 className="max-w-2xl text-[1.75rem] font-bold leading-tight text-ft-navy sm:text-[2.25rem]">
          What stays true at every step
        </h2>
        <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ft-line bg-ft-line sm:grid-cols-2">
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.label} delay={index * 0.05}>
              <div className="h-full bg-ft-cream p-8">
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
                  {principle.label}
                </dt>
                <dd className="mt-4 text-base leading-relaxed text-ft-navy">{principle.body}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>

      <FinalCTA />
    </>
  );
}
