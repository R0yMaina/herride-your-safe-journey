import { Link } from "@tanstack/react-router";
import type { ServiceRecord } from "../../data/services";
import { FT_ROUTES } from "../../data/site";

/**
 * One of the four things we build. The hover state does one thing — the card
 * lifts and its rule extends — rather than several.
 */
export function ServiceCard({ service }: { service: ServiceRecord }) {
  return (
    <Link
      to={FT_ROUTES.services}
      hash={service.id}
      className="group relative flex h-full flex-col rounded-xl border border-ft-line bg-ft-cream p-7 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-ft-navy/20 hover:shadow-[0_20px_50px_-32px_rgba(15,26,43,0.4)] sm:p-8"
    >
      <div className="flex items-baseline gap-4">
        <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-ft-gold-deep">
          {service.number}
        </span>
        {/* The card's one hover interaction: the rule extends and warms to gold. */}
        <span className="h-px flex-1 origin-left scale-x-[0.3] bg-ft-line transition-[transform,background-color] duration-500 ease-out group-hover:scale-x-100 group-hover:bg-ft-gold" />
      </div>

      <h3 className="mt-6 text-2xl font-bold text-ft-navy">{service.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ft-navy-soft">{service.summary}</p>

      <ul className="mt-6 space-y-2 border-t border-ft-line pt-6">
        {service.includes.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-ft-navy">
            <span
              aria-hidden="true"
              className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-ft-gold"
            />
            {item}
          </li>
        ))}
      </ul>

      <span className="mt-auto flex items-center gap-2 pt-7 text-sm font-semibold text-ft-navy">
        Explore
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  );
}
