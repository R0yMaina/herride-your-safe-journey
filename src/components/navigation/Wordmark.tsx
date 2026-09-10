import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { FT_ROUTES, SITE } from "../../data/site";

/** The logo is typographic on purpose — the wordmark plus one gold mark. */
export function Wordmark({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <Link
      to={FT_ROUTES.home}
      className={cn(
        "group inline-flex items-baseline gap-[3px] text-[0.95rem] font-extrabold uppercase tracking-[0.2em]",
        onDark ? "text-ft-cream" : "text-ft-navy",
        className,
      )}
      aria-label={`${SITE.name} — home`}
    >
      <span>Forgetech</span>
      <span
        aria-hidden="true"
        className="size-1 translate-y-[-1px] rounded-full bg-ft-gold transition-transform duration-300 group-hover:scale-150"
      />
    </Link>
  );
}
