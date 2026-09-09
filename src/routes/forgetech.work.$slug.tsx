import { createFileRoute, notFound } from "@tanstack/react-router";
import { CaseStudyPage } from "@/features/forgetech/pages/CaseStudyPage";
import { findCaseStudy } from "@/features/forgetech/data/projects";
import { seo } from "@/features/forgetech/seo";

export const Route = createFileRoute("/forgetech/work/$slug")({
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
