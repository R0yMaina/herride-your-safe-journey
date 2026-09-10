import { createFileRoute } from "@tanstack/react-router";
import { ProcessPage } from "@/pages/ProcessPage";
import { seo } from "@/seo";

export const Route = createFileRoute("/process")({
  head: () =>
    seo({
      path: "/process",
      title: "Process",
      description:
        "How a Forgetech project runs: discover, strategize, design, build, test, launch, scale.",
    }),
  component: ProcessPage,
});
