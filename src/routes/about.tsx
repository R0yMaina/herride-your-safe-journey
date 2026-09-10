import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/AboutPage";
import { seo } from "@/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      path: "/about",
      title: "About",
      description:
        "Forgetech is a technology company in Kenya building digital products, AI solutions, websites and automation systems.",
    }),
  component: AboutPage,
});
