import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHero, Reveal, Section, Button } from "@/components/ui";
import { InsightCard } from "@/components/cards";
import { FinalCTA } from "@/components/sections";
import {
  INSIGHTS,
  INSIGHT_CATEGORIES,
  featuredInsight,
  formatDate,
  readingTime,
  type InsightCategory,
} from "@/data/insights";
import { FT_ROUTES } from "@/data/site";

type Filter = InsightCategory | "All";

export function InsightsPage() {
  const [category, setCategory] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const featured = featuredInsight();

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INSIGHTS.filter((article) => {
      const matchesCategory = category === "All" || article.category === category;
      const matchesQuery =
        needle.length === 0 ||
        article.title.toLowerCase().includes(needle) ||
        article.excerpt.toLowerCase().includes(needle) ||
        article.category.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <>
      <PageHero
        eyebrow="The Forgetech Brief"
        title="Technology explained without the unnecessary jargon."
        lead="How the things behind your website and your product actually work — written for the person paying for them, not for the person building them."
      />

      {/* Featured */}
      <Section className="!pb-0">
        <Reveal>
          <Link
            to={FT_ROUTES.article}
            params={{ slug: featured.slug }}
            className="group grid overflow-hidden rounded-2xl border border-ft-line bg-ft-navy-deep transition-shadow duration-300 hover:shadow-[0_30px_70px_-45px_rgba(15,26,43,0.7)] lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="p-8 sm:p-12">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold">
                Featured · {featured.category}
              </span>
              <h2 className="mt-5 text-[1.75rem] font-bold leading-tight text-ft-cream sm:text-[2.5rem]">
                {featured.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ft-cream/70">
                {featured.excerpt}
              </p>
              <div className="mt-8 flex items-center gap-4 text-sm text-ft-cream/60">
                <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                <span aria-hidden="true" className="h-px w-4 bg-ft-cream/30" />
                <span>{readingTime(featured)} min read</span>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ft-gold">
                Read Article
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </div>
            <div
              aria-hidden="true"
              className="hidden items-center justify-center border-l border-ft-cream/10 p-12 lg:flex"
            >
              <span className="ft-accent text-[5rem] leading-none text-ft-cream/15">01</span>
            </div>
          </Link>
        </Reveal>
      </Section>

      <Section>
        {/* Controls */}
        <div className="flex flex-col gap-6 border-b border-ft-line pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["All", ...INSIGHT_CATEGORIES] as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                aria-pressed={category === option}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  category === option
                    ? "border-ft-navy bg-ft-navy text-ft-cream"
                    : "border-ft-line bg-ft-cream text-ft-navy hover:border-ft-navy/30",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="lg:w-72">
            <label htmlFor="ft-insights-search" className="sr-only">
              Search articles
            </label>
            <input
              id="ft-insights-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles"
              className="w-full rounded-full border border-ft-line bg-ft-cream px-5 py-2.5 text-sm text-ft-navy placeholder:text-ft-navy-soft/70 focus:border-ft-navy focus:outline-none"
            />
          </div>
        </div>

        <p aria-live="polite" className="mt-6 text-sm text-ft-navy-soft">
          {results.length} {results.length === 1 ? "article" : "articles"}
          {category !== "All" && ` in ${category}`}
        </p>

        {results.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {results.map((article, index) => (
              <Reveal key={article.slug} delay={Math.min(index, 5) * 0.04}>
                <div className="h-full">
                  <InsightCard article={article} />
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-ft-line px-8 py-16 text-center">
            <p className="text-lg font-semibold text-ft-navy">Nothing matches that yet.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ft-navy-soft">
              Try a different term, or clear the filters to see everything in the Brief.
            </p>
            <div className="mt-7 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </Section>

      <FinalCTA />
    </>
  );
}
