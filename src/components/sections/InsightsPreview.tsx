import { Section, SectionHeading, Reveal, Button } from "../ui";
import { InsightCard } from "../cards";
import { INSIGHTS } from "../../data/insights";
import { FT_ROUTES } from "../../data/site";

export function InsightsPreview() {
  return (
    <Section id="insights">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHeading
          eyebrow="The Forgetech Brief"
          title="Technology explained without the unnecessary jargon."
        />
        <Reveal className="hidden sm:block">
          <Button to={FT_ROUTES.insights} variant="secondary">
            All articles
          </Button>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
        {INSIGHTS.slice(0, 3).map((article, index) => (
          <Reveal key={article.slug} delay={index * 0.06}>
            <div className="h-full">
              <InsightCard article={article} />
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 sm:hidden">
        <Button to={FT_ROUTES.insights} variant="secondary" className="w-full">
          All articles
        </Button>
      </div>
    </Section>
  );
}
