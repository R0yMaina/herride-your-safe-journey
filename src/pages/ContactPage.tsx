import { Container, PageHero, Reveal, Section } from "@/components/ui";
import { ProjectBriefForm } from "@/components/forms/ProjectBriefForm";
import { PROCESS_STEPS } from "@/data/process";
import { SITE, SOCIALS } from "@/data/site";

/**
 * Not a contact form — a project brief. The fields are the ones we would ask
 * about in a first call, so the first reply can be useful rather than a
 * request for the same information.
 */
export function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Start a project"
        title="Tell us what you're building."
        lead="The more you can say about the problem, the more useful our first reply will be. If you're still working out what you need, say that instead — it's a normal place to start."
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
          <div>
            <ProjectBriefForm />
          </div>

          <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="rounded-2xl border border-ft-line bg-ft-cream-deep p-7">
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
                  What happens next
                </h2>
                <ol className="mt-5 space-y-4">
                  {PROCESS_STEPS.slice(0, 3).map((step) => (
                    <li key={step.number} className="flex gap-4">
                      <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-ft-gold-deep">
                        {step.number}
                      </span>
                      <span>
                        <span className="block text-base font-semibold text-ft-navy">
                          {step.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-ft-navy-soft">
                          {step.summary}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div id="talk" className="scroll-mt-28">
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
                  Prefer to talk first?
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-ft-navy-soft">
                  Message us on either of these and we'll pick it up from there.
                </p>
                <ul className="mt-5 space-y-3">
                  {SOCIALS.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group flex items-baseline justify-between gap-4 border-b border-ft-line pb-3 text-sm"
                      >
                        <span className="font-semibold text-ft-navy">{social.label}</span>
                        <span className="text-ft-navy-soft transition-colors group-hover:text-ft-gold-deep">
                          {social.handle}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-ft-navy-soft">
                  <a href={SITE.url} className="hover:text-ft-navy">
                    {SITE.domain}
                  </a>
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      </Section>

      <section className="border-t border-ft-line bg-ft-navy-deep py-20 sm:py-24">
        <Container>
          <Reveal>
            <p className="ft-accent max-w-2xl text-2xl leading-snug text-ft-cream sm:text-3xl">
              We'd rather understand the problem properly than quote quickly.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
