import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArticlePage } from "@/features/forgetech/pages/ArticlePage";
import { findInsight } from "@/features/forgetech/data/insights";
import { seo } from "@/features/forgetech/seo";

export const Route = createFileRoute("/forgetech/insights/$slug")({
  loader: ({ params }) => {
    const article = findInsight(params.slug);
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          path: `/insights/${loaderData.slug}`,
          title: loaderData.title,
          description: loaderData.excerpt,
          type: "article",
        })
      : {},
  component: ArticleRoute,
});

function ArticleRoute() {
  const article = Route.useLoaderData();
  return <ArticlePage article={article} />;
}
