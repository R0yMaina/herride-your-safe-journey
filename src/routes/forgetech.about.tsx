import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/features/forgetech/pages/AboutPage";
import { seo } from "@/features/forgetech/seo";

export const Route = createFileRoute("/forgetech/about")({
  head: () =>
    seo({
      path: "/about",
      title: "About",
      description:
        "Forgetech is a technology company in Kenya building digital products, AI solutions, websites and automation systems.",
    }),
  component: AboutPage,
});
