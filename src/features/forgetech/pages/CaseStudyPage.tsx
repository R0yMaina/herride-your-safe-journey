import { Link } from "@tanstack/react-router";
import { Container, PageHero, Reveal, Section, Button } from "../components/ui";
import { ProjectMotif } from "../components/cards";
import { FinalCTA } from "../components/sections";
import { CASE_STUDIES, type CaseStudy } from "../data/projects";
import { FT_ROUTES } from "../data/site";

/**
 * The reusable case-study template. Every project renders through this, so
 * adding one is a data change, not a design exercise.
 *
 * `outcome` is the honest part: when a project has no measured result yet, the
 * section says that plainly instead of inventing one.
 */
export function CaseStudyPage({ project }: { project: CaseStudy }) {
  const others = CASE_STUDIES.filter((candidate) => candidate.slug !== project.slug);

  return (
    <>
      <PageHero eyebrow={project.category} title={project.name} lead={project.summary}>
        <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-ft-line pt-7">
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ft-navy-soft">
              Industry
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ft-navy">{project.industry}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ft-navy-soft">
              Project
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ft-navy">{project.name}</dd>
          </div>
        </dl>
      </PageHero>

      <Container className="pt-12 sm:pt-16">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-ft-navy-deep">
            <div className="aspect-[16/9] sm:aspect-[21/9]">
              <ProjectMotif motif={project.motif} />
            </div>
          </div>
        </Reveal>
      </Container>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="ft-accent text-2xl leading-snug text-ft-navy">
                Problem → Approach → Solution
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ft-navy-soft">
                The order matters. Nothing was designed before the problem was understood.
              </p>
            </Reveal>
          </div>

          <div className="max-w-2xl space-y-12">
            <Block title="The Problem" body={project.problem} />
            <Block title="The Approach" body={project.approach} />
            <Block title="The Solution" body={project.solution} />

            <Reveal>
              <div>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
                  Key Features
                </h2>
                <ul className="mt-5 divide-y divide-ft-line border-y border-ft-line">
                  {project.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-4 py-4 text-base leading-relaxed text-ft-navy"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1 shrink-0 rounded-full bg-ft-gold"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal>
              <div>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
                  Technology
                </h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {project.technology.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full border border-ft-line bg-ft-cream-deep px-3.5 py-1.5 text-sm text-ft-navy"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal>
              <div>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
                  Outcome
                </h2>
                {project.outcome ? (
                  <p className="mt-5 text-base leading-relaxed text-ft-navy">{project.outcome}</p>
                ) : (
                  <p className="mt-5 border-l-2 border-ft-line pl-5 text-base leading-relaxed text-ft-navy-soft">
                    This project is in active development. We publish outcomes here only once they
                    have been measured — no estimates, and no numbers we cannot stand behind.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="cream-deep" bordered>
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
            More work
          </h2>
          <ul className="mt-8 divide-y divide-ft-line border-y border-ft-line">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  to={FT_ROUTES.caseStudy}
                  params={{ slug: other.slug }}
                  className="group flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 py-6"
                >
                  <span className="text-xl font-bold text-ft-navy sm:text-2xl">{other.name}</span>
                  <span className="text-sm text-ft-navy-soft">{other.category}</span>
                  <span
                    aria-hidden="true"
                    className="text-ft-navy transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button to={FT_ROUTES.work} variant="secondary">
              All work
            </Button>
          </div>
        </Section>
      )}

      <FinalCTA />
    </>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <Reveal>
      <div>
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
          {title}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-ft-navy sm:text-lg">{body}</p>
      </div>
    </Reveal>
  );
}
