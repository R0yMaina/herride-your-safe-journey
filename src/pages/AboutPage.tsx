import { PageHero, Reveal, Section } from "@/components/ui";
import { FinalCTA } from "@/components/sections";
import { ABOUT_PRINCIPLES } from "@/data/principles";
import { SITE, SOCIALS } from "@/data/site";

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={
          <>
            We're building the technology behind{" "}
            <span className="ft-accent text-ft-gold-deep">what's next.</span>
          </>
        }
        lead="Forgetech is a technology company. We build websites, AI solutions, automation systems and digital products — and we care more about whether they work than about how they look in a portfolio."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.5fr_1.5fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="ft-accent text-2xl leading-snug text-ft-navy">{SITE.positioning}</p>
            </Reveal>
          </div>

          <div className="max-w-2xl space-y-14">
            <Block title="Who We Are">
              Forgetech is a technology company focused on building digital products, AI solutions,
              websites and automation systems. We work with businesses that need something built
              properly and with founders turning an idea into a first version.
            </Block>

            <Block title="What We Believe">
              Technology should be useful, accessible and designed around real problems. Most
              software fails not because it was built badly but because it was built for a problem
              nobody had. We would rather spend a week making sure we are building the right thing
              than a month building the wrong one well.
            </Block>

            <Block title="Our Vision">
              To become a leading African technology company building products and systems that
              create meaningful impact. We build here, for the conditions here — mid-range devices,
              variable connections, real constraints — which turns out to be a good discipline for
              building anywhere.
            </Block>
          </div>
        </div>
      </Section>

      <Section tone="cream-deep" bordered>
        <h2 className="text-[1.75rem] font-bold leading-tight text-ft-navy sm:text-[2.25rem]">
          Our Principles
        </h2>
        <ol className="mt-10 divide-y divide-ft-line border-y border-ft-line">
          {ABOUT_PRINCIPLES.map((principle, index) => (
            <Reveal key={principle} delay={index * 0.04}>
              <li className="flex items-baseline gap-6 py-6">
                <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-ft-gold-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xl font-bold text-ft-navy sm:text-2xl">{principle}</span>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal>
          <div className="mt-14">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
              Where to find us
            </h2>
            <ul className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group text-base font-medium text-ft-navy"
                  >
                    {social.label}{" "}
                    <span className="text-ft-navy-soft transition-colors group-hover:text-ft-gold-deep">
                      {social.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>

      <FinalCTA />
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <div>
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
          {title}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-ft-navy sm:text-lg">{children}</p>
      </div>
    </Reveal>
  );
}
