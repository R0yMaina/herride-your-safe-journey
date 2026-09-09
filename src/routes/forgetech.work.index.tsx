import { createFileRoute } from "@tanstack/react-router";
import { WorkPage } from "@/features/forgetech/pages/WorkPage";
import { seo } from "@/features/forgetech/seo";

export const Route = createFileRoute("/forgetech/work/")({
  head: () =>
    seo({
      path: "/work",
      title: "Work",
      description:
        "Case studies from Forgetech — mobility, health technology and marketplace platforms, each built around a real problem.",
    }),
  component: WorkPage,
});
