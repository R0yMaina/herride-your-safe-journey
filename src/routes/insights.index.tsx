import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/pages/InsightsPage";
import { seo } from "@/seo";

export const Route = createFileRoute("/insights/")({
  head: () =>
    seo({
      path: "/insights",
      title: "The Forgetech Brief",
      description:
        "Technology explained without the unnecessary jargon — web performance, payments, authentication, AI and how software actually works.",
    }),
  component: InsightsPage,
});
