import { Section, SectionHeading, Reveal, Button } from "../ui";
import { ProjectCard } from "../cards";
import { CASE_STUDIES } from "../../data/projects";
import { FT_ROUTES } from "../../data/site";

export function WorkPreview() {
  return (
    <Section id="work">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHeading
          eyebrow="Our work"
          title="Built for real problems."
          lead="We don't build projects just to fill a portfolio. We build technology around real users, real problems and real opportunities."
        />
        <Reveal className="hidden sm:block">
          <Button to={FT_ROUTES.work} variant="secondary">
            All work
          </Button>
        </Reveal>
      </div>

      <div className="mt-14 space-y-6 lg:mt-16">
        {CASE_STUDIES.map((project, index) => (
          <Reveal key={project.slug} delay={index * 0.05}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
