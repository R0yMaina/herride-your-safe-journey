import { Section, SectionHeading, Reveal } from "../ui";
import { PRINCIPLES } from "../../data/principles";

/** The manifesto. Four statements, set large, with nothing else on the page. */
export function WhyForgetech() {
  return (
    <Section id="why">
      <SectionHeading
        eyebrow="Why Forgetech"
        title={
          <>
            We don't just build. <span className="ft-accent text-ft-gold-deep">We think.</span>
          </>
        }
      />
      <dl className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ft-line bg-ft-line sm:grid-cols-2 lg:mt-16">
        {PRINCIPLES.map((principle, index) => (
          <Reveal key={principle.label} delay={index * 0.05}>
            <div className="h-full bg-ft-cream p-8 sm:p-10">
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
                {principle.label}
              </dt>
              <dd className="mt-4 text-base leading-relaxed text-ft-navy sm:text-lg">
                {principle.body}
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}
