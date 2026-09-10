import { createFileRoute } from "@tanstack/react-router";
import { WorkPage } from "@/pages/WorkPage";
import { seo } from "@/seo";

export const Route = createFileRoute("/work/")({
  head: () =>
    seo({
      path: "/work",
      title: "Work",
      description:
        "Case studies from Forgetech — mobility, health technology and marketplace platforms, each built around a real problem.",
    }),
  component: WorkPage,
});
