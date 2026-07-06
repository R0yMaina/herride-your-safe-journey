import { GlassCard, Section } from "@/components/common";
import { RIDE_CATEGORIES } from "../data/placeholders";

export function RideCategoryList() {
  return (
    <Section title="Choose your ride">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide">
        {RIDE_CATEGORIES.map((c) => (
          <GlassCard key={c.id} className="min-w-[62%] snap-start">
            <p className="font-display text-lg text-foreground">{c.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
            <p className="mt-4 text-sm font-semibold text-primary">{c.priceLabel}</p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}