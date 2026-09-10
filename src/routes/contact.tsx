import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages/ContactPage";
import { seo } from "@/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    seo({
      path: "/contact",
      title: "Start a Project",
      description:
        "Tell us what you're building. Send Forgetech a project brief — website, web application, AI, automation, e-commerce or startup MVP.",
    }),
  component: ContactPage,
});
