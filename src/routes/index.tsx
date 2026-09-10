import { createFileRoute } from "@tanstack/react-router";
import {
  Hero,
  BrandStatement,
  WhatWeBuild,
  ProblemSolutionSection,
  WorkPreview,
  ProcessSection,
  WhyForgetech,
  TechnologyTicker,
  InsightsPreview,
  FinalCTA,
} from "@/components/sections";
import { seo } from "@/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      path: "/",
      title: "Forgetech",
      description:
        "Forgetech is a technology studio in Kenya building websites, AI solutions, business automation and digital products for businesses and startups.",
    }),
  component: HomePage,
});

/**
 * The homepage, read as one argument:
 * problem → possibility → solution → proof → process → technology → call.
 * Each section below is one beat of it.
 */
function HomePage() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <WhatWeBuild />
      <ProblemSolutionSection />
      <WorkPreview />
      <ProcessSection />
      <WhyForgetech />
      <TechnologyTicker />
      <InsightsPreview />
      <FinalCTA />
    </>
  );
}
