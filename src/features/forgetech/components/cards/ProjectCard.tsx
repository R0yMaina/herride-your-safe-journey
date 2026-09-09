import { Link } from "@tanstack/react-router";
import type { CaseStudy } from "../../data/projects";
import { FT_ROUTES } from "../../data/site";
import { ProjectMotif } from "./ProjectMotif";

/** A large case-study card: category, name, the problem in one line, and the
 *  three-beat problem → solution → technology summary the section promises. */
export function ProjectCard({ project }: { project: CaseStudy }) {
  return (
    <Link
      to={FT_ROUTES.caseStudy}
      params={{ slug: project.slug }}
      className="group grid overflow-hidden rounded-2xl border border-ft-line bg-ft-cream transition-[border-color,box-shadow] duration-300 hover:border-ft-navy/20 hover:shadow-[0_28px_60px_-40px_rgba(15,26,43,0.45)] lg:grid-cols-[0.85fr_1.15fr]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ft-navy-deep lg:aspect-auto lg:min-h-[22rem]">
        <ProjectMotif motif={project.motif} />
      </div>

      <div className="flex flex-col p-7 sm:p-10">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
          {project.category}
        </span>
        <h3 className="mt-4 text-[1.75rem] font-bold leading-tight text-ft-navy sm:text-[2rem]">
          {project.name}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ft-navy-soft sm:text-base">
          {project.summary}
        </p>

        <dl className="mt-8 space-y-5 border-t border-ft-line pt-7">
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ft-navy-soft">
              Problem
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-ft-navy">{project.problem}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ft-navy-soft">
              Solution
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-ft-navy">{project.solution}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ft-navy-soft">
              Technology
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {project.technology.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-ft-line bg-ft-cream-deep px-3 py-1 text-xs text-ft-navy"
                >
                  {tech}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-ft-navy">
          Read the case study
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
