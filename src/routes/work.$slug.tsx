import { createFileRoute, notFound } from "@tanstack/react-router";
import { CaseStudyPage } from "@/pages/CaseStudyPage";
import { findCaseStudy } from "@/data/projects";
import { seo } from "@/seo";

export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const project = findCaseStudy(params.slug);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          path: `/work/${loaderData.slug}`,
          title: `${loaderData.name} — Case study`,
          description: loaderData.summary,
          type: "article",
        })
      : {},
  component: CaseStudyRoute,
});

function CaseStudyRoute() {
  const project = Route.useLoaderData();
  return <CaseStudyPage project={project} />;
}
