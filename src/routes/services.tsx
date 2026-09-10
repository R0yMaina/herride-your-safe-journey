import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/pages/ServicesPage";
import { seo } from "@/seo";

export const Route = createFileRoute("/services")({
  head: () =>
    seo({
      path: "/services",
      title: "Services",
      description:
        "Website development, AI solutions, business automation and digital product development — what each one solves, what we build, and the technology behind it.",
    }),
  component: ServicesPage,
});
