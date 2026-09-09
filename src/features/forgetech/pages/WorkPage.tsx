import { PageHero, Reveal, Section } from "../components/ui";
import { FinalCTA } from "../components/sections";
import { ProjectCard } from "../components/cards";
import { CASE_STUDIES } from "../data/projects";

export function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Work"
        title="Built for real problems."
        lead="We don't build projects just to fill a portfolio. Each of these started with something that was not working — for a rider, a patient, or someone looking for somewhere to live."
      />

      <Section>
        <div className="space-y-6">
          {CASE_STUDIES.map((project, index) => (
            <Reveal key={project.slug} delay={index * 0.05}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-14 max-w-2xl text-sm leading-relaxed text-ft-navy-soft">
            Results are published here only once they have been measured. Where a project is still
            in development, this page says so rather than filling the space with numbers.
          </p>
        </Reveal>
      </Section>

      <FinalCTA />
    </>
  );
}
