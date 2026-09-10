import { Section, SectionHeading, Reveal } from "../ui";
import { TECH_GROUPS, TECHNOLOGIES } from "../../data/technologies";

/**
 * The stack, twice: a grouped grid that says what each tool is for, and a
 * single quiet ticker underneath. A wall of logos with no grouping tells a
 * visitor nothing, so there isn't one.
 */
export function TechnologyTicker() {
  return (
    <Section id="technology" tone="cream-deep" bordered>
      <SectionHeading
        eyebrow="Technology"
        title="Built with modern technology."
        lead="We choose tools for what a product needs to do — and for how easily someone else could pick it up later."
      />

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ft-line bg-ft-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {TECH_GROUPS.map((group, index) => (
          <Reveal key={group.label} delay={index * 0.05}>
            <div className="h-full bg-ft-cream p-7">
              <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
                {group.label}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item} className="text-base font-medium text-ft-navy">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Ticker. Duplicated once so the translate loop is seamless; the copy is
          hidden from assistive tech so the list is only announced once. */}
      <div className="relative mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="ft-marquee flex w-max items-center gap-10">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="flex shrink-0 items-center gap-10"
            >
              {TECHNOLOGIES.map((tech) => (
                <li
                  key={tech}
                  className="whitespace-nowrap text-sm font-medium uppercase tracking-[0.12em] text-ft-navy-soft"
                >
                  {tech}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </Section>
  );
}
