import { TrendingUp } from "lucide-react";
import { formatSurge, isSurging } from "@/services/surge";
import { useT } from "@/i18n";

/**
 * Tells her prices are up, by how much, and why — before she commits.
 *
 * The multiplier is locked onto her ride the moment she books, so this number
 * is the one she pays even if demand spikes further while she is choosing a
 * car. Renders nothing below 1.1x, where the difference is not worth a banner.
 */
export function SurgeNotice({ multiplier }: { readonly multiplier: number }) {
  const { t } = useT();
  if (!isSurging(multiplier)) return null;

  return (
    <div className="flex items-start gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-xs text-foreground">
      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>
        <span className="font-semibold">
          {t("booking.surgeTitle", { multiplier: formatSurge(multiplier) })}
        </span>{" "}
        — {t("booking.surgeBody")}
      </span>
    </div>
  );
}
