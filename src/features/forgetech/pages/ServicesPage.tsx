import { Container, PageHero, Reveal, Section, Button } from "../components/ui";
import { FinalCTA } from "../components/sections";
import { SERVICES } from "../data/services";
import { FT_ROUTES } from "../data/site";

/**
 * Services in depth. Each of the four gets the same five blocks — overview,
 * the problems it answers, what we build, technology, typical use cases — so
 * a visitor can compare them rather than read four different pitches.
 */
export function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Four ways we turn a business problem into working software."
        lead="Most projects start as one of these and end up touching two. The overlap is the point — a website that books appointments is also an automation, and a product with an assistant in it is also AI."
      >
        <nav aria-label="Services" className="mt-9 flex flex-wrap gap-2">
          {SERVICES.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className="rounded-full border border-ft-line bg-ft-cream px-4 py-2 text-sm font-medium text-ft-navy transition-colors hover:border-ft-navy/30 hover:bg-ft-cream-deep"
            >
              {service.title}
            </a>
          ))}
        </nav>
      </PageHero>

      {SERVICES.map((service, index) => (
        <Section
          key={service.id}
          id={service.id}
          tone={index % 2 === 0 ? "cream" : "cream-deep"}
          bordered={index > 0}
        >
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-ft-gold-deep">
                  {service.number}
                </span>
                <h2 className="mt-4 text-[2rem] font-bold leading-tight text-ft-navy sm:text-[2.5rem]">
                  {service.title}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-ft-navy-soft">
                  {service.overview}
                </p>
                <div className="mt-8">
                  <Button to={FT_ROUTES.contact} arrow>
                    {service.ctaLabel}
                  </Button>
                </div>
              </Reveal>
            </div>

            <div className="space-y-10">
              <DetailBlock title="Problems it solves" items={service.problems} numbered />
              <DetailBlock title="What we build" items={service.builds} />
              <Reveal>
                <div>
                  <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
                    Technology
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {service.technology.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-ft-line bg-ft-cream px-3.5 py-1.5 text-sm text-ft-navy"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <DetailBlock title="Typical use cases" items={service.useCases} />
            </div>
          </div>
        </Section>
      ))}

      <Section tone="cream" bordered>
        <Container size="narrow" className="px-0 text-center sm:px-0 lg:px-0">
          <Reveal>
            <p className="ft-accent text-2xl leading-snug text-ft-navy sm:text-3xl">
              Not sure which of these you need?
            </p>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ft-navy-soft">
              Describe the problem instead of the solution. Working out which of these answers it is
              our job, and it is the first thing we do on every project.
            </p>
            <div className="mt-8 flex justify-center">
              <Button to={FT_ROUTES.contact} arrow>
                Tell us what you're building
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}

function DetailBlock({
  title,
  items,
  numbered,
}: {
  title: string;
  items: readonly string[];
  numbered?: boolean;
}) {
  return (
    <Reveal>
      <div>
        <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
          {title}
        </h3>
        <ul className="mt-4 divide-y divide-ft-line border-y border-ft-line">
          {items.map((item, index) => (
            <li key={item} className="flex gap-4 py-4 text-base leading-relaxed text-ft-navy">
              <span
                aria-hidden="true"
                className="w-5 shrink-0 pt-0.5 text-xs font-semibold text-ft-gold-deep"
              >
                {numbered ? String(index + 1).padStart(2, "0") : "—"}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
