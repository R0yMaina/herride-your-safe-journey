import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/forgetech/pages/ServicesPage";
import { seo } from "@/features/forgetech/seo";

export const Route = createFileRoute("/forgetech/services")({
  head: () =>
    seo({
      path: "/services",
      title: "Services",
      description:
        "Website development, AI solutions, business automation and digital product development — what each one solves, what we build, and the technology behind it.",
    }),
  component: ServicesPage,
});
