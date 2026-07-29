import { Link } from "@tanstack/react-router";
import { ChevronRight, Tag } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { ActivePromo } from "@/services/promos";

interface PromoBannerProps {
  readonly promo: ActivePromo;
  readonly className?: string;
}

/**
 * A live offer, advertised on the way into booking.
 *
 * The headline is display only — the discount is recomputed server-side by
 * `validate_promo` when the code is applied, so what's shown here can never
 * become what's charged.
 */
export function PromoBanner({ promo, className }: PromoBannerProps) {
  return (
    <Link
      to={ROUTES.book}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-gradient-pink px-4 py-3 text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
        <Tag className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{promo.headline}</span>
        <span className="block truncate text-xs opacity-90">
          {promo.description ?? `Use code ${promo.code}`}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}
