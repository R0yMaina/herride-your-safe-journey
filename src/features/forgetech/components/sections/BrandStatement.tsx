import { Section, Reveal } from "../ui";
import { Rule } from "../ui/SectionHeading";

/** The site's editorial beat: one idea, a lot of air, no graphics. */
export function BrandStatement() {
  return (
    <Section tone="cream-deep" bordered>
      <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-20">
        <Reveal className="hidden lg:block">
          <Rule className="mt-4 w-16" />
        </Reveal>

        <div className="max-w-3xl">
          <Reveal>
            <h2 className="text-[2rem] font-bold leading-[1.12] text-ft-navy sm:text-[2.75rem] lg:text-[3.5rem]">
              Technology should solve problems,{" "}
              <span className="ft-accent block text-ft-navy-soft sm:inline">
                not create more of them.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-ft-navy-soft sm:text-lg">
              We combine design, software and AI to create digital experiences that help businesses
              operate better, reach more customers and build for the future.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
