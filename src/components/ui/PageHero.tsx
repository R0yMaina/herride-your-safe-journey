import type { ReactNode } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { Eyebrow, Rule } from "./SectionHeading";

/** Every page other than the homepage opens the same way: label, headline,
 *  one paragraph. Consistency here is what makes the site feel designed. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-ft-line pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
      <Container>
        <div className="max-w-3xl">
          <Reveal className="flex items-center gap-3">
            <Rule />
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-[2.25rem] font-bold leading-[1.06] text-ft-navy sm:text-[3rem] lg:text-[3.75rem]">
              {title}
            </h1>
          </Reveal>
          {lead && (
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-ft-navy-soft sm:text-lg">
                {lead}
              </p>
            </Reveal>
          )}
          {children && <Reveal delay={0.15}>{children}</Reveal>}
        </div>
      </Container>
    </section>
  );
}
