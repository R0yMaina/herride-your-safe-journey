import { useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/common";
import { promoService } from "@/services/promos";
import { useRideRequestStore } from "@/store/ride-request.store";
import { formatCurrency } from "../lib/format";

/**
 * Promo code entry on the confirm step. Validation is SERVER-side
 * (validate_promo) — the client only previews the resulting discount; the
 * code is locked onto the ride after booking via apply_promo, and settlement
 * honours it in complete_ride. Applied state lives in the ride-request store.
 */
export function PromoCodeCard() {
  const fare = useRideRequestStore((s) => s.fare);
  const promo = useRideRequestStore((s) => s.promo);
  const setPromo = useRideRequestStore((s) => s.setPromo);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

  const apply = async () => {
    if (!code.trim() || checking) return;
    setChecking(true);
    try {
      const preview = await promoService.validate(code, fare?.total ?? 0);
      setPromo(preview);
      toast.success(`${preview.code} applied — ${formatCurrency(preview.discount)} off`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid promo code");
    } finally {
      setChecking(false);
    }
  };

  if (promo) {
    return (
      <GlassCard className="flex items-center gap-3 py-3">
        <TicketPercent className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{promo.code}</p>
          <p className="truncate text-xs text-muted-foreground">{promo.label}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-primary">
          −{formatCurrency(promo.discount)}
        </span>
        <button
          type="button"
          onClick={() => setPromo(null)}
          aria-label="Remove promo"
          className="p-1 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex items-center gap-2 py-3">
      <TicketPercent className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && void apply()}
        placeholder="Promo code"
        maxLength={24}
        className="min-w-0 flex-1 bg-transparent text-sm uppercase tracking-wide text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:outline-none"
      />
      <button
        type="button"
        onClick={apply}
        disabled={!code.trim() || checking}
        className="shrink-0 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
      >
        {checking ? "Checking…" : "Apply"}
      </button>
    </GlassCard>
  );
}
