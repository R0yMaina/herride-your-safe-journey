import { Link } from "@tanstack/react-router";
import { Container, Reveal, Section, Button } from "@/components/ui";
import { Eyebrow, Rule } from "@/components/ui/SectionHeading";
import { JsonLd } from "@/components/ui/JsonLd";
import { InsightCard } from "@/components/cards";
import { FinalCTA } from "@/components/sections";
import { formatDate, readingTime, relatedInsights, type Insight } from "@/data/insights";
import { FT_ROUTES, SITE } from "@/data/site";

export function ArticlePage({ article }: { article: Insight }) {
  const related = relatedInsights(article);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    articleSection: article.category,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/insights/${article.slug}`,
  };

  return (
    <>
      <article>
        <header className="border-b border-ft-line pb-12 pt-14 sm:pb-16 sm:pt-20">
          <Container size="narrow">
            <Reveal>
              <Link
                to={FT_ROUTES.insights}
                className="group inline-flex items-center gap-2 text-sm font-medium text-ft-navy-soft transition-colors hover:text-ft-navy"
              >
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:-translate-x-1"
                >
                  ←
                </span>
                The Forgetech Brief
              </Link>
            </Reveal>

            <Reveal delay={0.05} className="mt-8 flex items-center gap-3">
              <Rule />
              <Eyebrow>{article.category}</Eyebrow>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="mt-5 text-[2rem] font-bold leading-[1.1] text-ft-navy sm:text-[2.75rem]">
                {article.title}
              </h1>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="mt-5 text-base leading-relaxed text-ft-navy-soft sm:text-lg">
                {article.excerpt}
              </p>
              <div className="mt-7 flex items-center gap-4 text-sm text-ft-navy-soft">
                <time dateTime={article.date}>{formatDate(article.date)}</time>
                <span aria-hidden="true" className="h-px w-4 bg-ft-line" />
                <span>{readingTime(article)} min read</span>
              </div>
            </Reveal>
          </Container>
        </header>

        <Container size="narrow" className="py-14 sm:py-20">
          <div className="space-y-9">
            {article.body.map((block, index) => (
              <Reveal key={index} delay={0.02 * Math.min(index, 6)}>
                <div>
                  {block.heading && (
                    <h2 className="mb-4 text-xl font-bold text-ft-navy sm:text-2xl">
                      {block.heading}
                    </h2>
                  )}
                  <p className="text-[1.0625rem] leading-[1.75] text-ft-navy/90">{block.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-16 rounded-2xl border border-ft-line bg-ft-cream-deep p-8 sm:p-10">
              <p className="ft-accent text-xl text-ft-navy sm:text-2xl">
                Working on something this applies to?
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ft-navy-soft">
                We build the things we write about. If this is a decision you are facing on a real
                project, tell us about it.
              </p>
              <div className="mt-7">
                <Button to={FT_ROUTES.contact} arrow>
                  Start a Project
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </article>

      {related.length > 0 && (
        <Section tone="cream-deep" bordered>
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
            Related reading
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {related.map((item, index) => (
              <Reveal key={item.slug} delay={index * 0.05}>
                <div className="h-full">
                  <InsightCard article={item} />
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <FinalCTA />
      <JsonLd data={schema} />
    </>
  );
}
