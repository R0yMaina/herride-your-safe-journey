import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, Section } from "@/components/common";
import { promoService } from "@/services/promos";

/**
 * Referral program (Uber/Bolt "Invite & earn"): shows the user's personal
 * code + share link, and lets a new rider redeem a friend's code before her
 * first trip. Both wallets are credited server-side when that first trip
 * completes — the client never touches balances.
 */
export function InviteEarnCard() {
  const { data: referral } = useQuery({
    queryKey: ["referral", "code"],
    queryFn: () => promoService.getReferralInfo(),
  });
  const [friendCode, setFriendCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const copy = async () => {
    if (!referral) return;
    const copied = await navigator.clipboard?.writeText(referral.url).then(
      () => true,
      () => false,
    );
    toast.success(copied ? "Invite link copied" : referral.url);
  };

  const redeem = async () => {
    if (!friendCode.trim() || redeeming) return;
    setRedeeming(true);
    try {
      await promoService.redeemReferral(friendCode);
      toast.success("Referral code applied — reward lands after your first trip");
      setFriendCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not redeem code");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Section title="Invite & earn">
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base text-foreground">Give a ride, get a reward</p>
            <p className="text-xs text-muted-foreground">
              You both earn wallet credit when your friend completes her first trip.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={copy}
          disabled={!referral}
          className="flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3 disabled:opacity-60"
        >
          <span className="font-mono text-sm font-semibold tracking-widest text-primary">
            {referral?.code ?? "· · · · · ·"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Copy className="h-3.5 w-3.5" /> Copy link
          </span>
        </button>

        <div className="flex items-center gap-2">
          <input
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && void redeem()}
            placeholder="Have a friend's code?"
            maxLength={16}
            className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-transparent px-3 py-2.5 text-sm uppercase tracking-wide text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={redeem}
            disabled={!friendCode.trim() || redeeming}
            className="shrink-0 rounded-2xl bg-primary/15 px-4 py-2.5 text-xs font-semibold text-primary disabled:opacity-50"
          >
            {redeeming ? "…" : "Redeem"}
          </button>
        </div>
      </GlassCard>
    </Section>
  );
}
