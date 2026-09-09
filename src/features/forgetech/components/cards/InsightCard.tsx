import { Link } from "@tanstack/react-router";
import { formatDate, readingTime, type Insight } from "../../data/insights";
import { FT_ROUTES } from "../../data/site";

export function InsightCard({ article }: { article: Insight }) {
  return (
    <Link
      to={FT_ROUTES.article}
      params={{ slug: article.slug }}
      className="group flex h-full flex-col rounded-xl border border-ft-line bg-ft-cream p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-ft-navy/20 sm:p-7"
    >
      <div className="flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em]">
        <span className="text-ft-gold-deep">{article.category}</span>
        <span aria-hidden="true" className="h-px w-4 bg-ft-line" />
        <span className="font-medium normal-case tracking-normal text-ft-navy-soft">
          {readingTime(article)} min read
        </span>
      </div>

      <h3 className="mt-5 text-lg font-bold leading-snug text-ft-navy sm:text-xl">
        {article.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-ft-navy-soft">{article.excerpt}</p>

      <div className="mt-auto flex items-center justify-between pt-7">
        <span className="flex items-center gap-2 text-sm font-semibold text-ft-navy">
          Read Article
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
        <time dateTime={article.date} className="text-xs text-ft-navy-soft">
          {formatDate(article.date)}
        </time>
      </div>
    </Link>
  );
}
