import { createFileRoute } from "@tanstack/react-router";
import { ProcessPage } from "@/features/forgetech/pages/ProcessPage";
import { seo } from "@/features/forgetech/seo";

export const Route = createFileRoute("/forgetech/process")({
  head: () =>
    seo({
      path: "/process",
      title: "Process",
      description:
        "How a Forgetech project runs: discover, strategize, design, build, test, launch, scale.",
    }),
  component: ProcessPage,
});
