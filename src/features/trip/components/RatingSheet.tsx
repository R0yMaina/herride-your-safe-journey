import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/common";
import { ratingService, COMPLIMENT_OPTIONS, TIP_PRESETS } from "@/services/ratings";
import { formatCurrency } from "@/features/ride-request/lib/format";

interface RatingSheetProps {
  readonly rideId: string;
  /** Driver's first name for the heading; falls back to "your driver". */
  readonly driverName?: string | null;
  /** Tips are passenger→driver only; hide the tip row for drivers. */
  readonly canTip?: boolean;
  readonly onDone?: () => void;
}

/**
 * Post-trip rating card (Uber/Bolt-style): 1–5 stars, compliment chips, an
 * optional note and one-tap tip. Renders only until this ride is rated —
 * checks has_rated on mount and disappears after submit. All writes go
 * through ratingService (submit_rating RPC settles any tip server-side).
 */
export function RatingSheet({ rideId, driverName, canTip = true, onDone }: RatingSheetProps) {
  const [visible, setVisible] = useState<boolean | null>(null);
  const [stars, setStars] = useState(0);
  const [compliments, setCompliments] = useState<readonly string[]>([]);
  const [comment, setComment] = useState("");
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ratingService
      .hasRated(rideId)
      .then((rated) => !cancelled && setVisible(!rated))
      .catch(() => !cancelled && setVisible(true));
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  if (!visible) return null;

  const toggleCompliment = (id: string) =>
    setCompliments((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));

  const submit = async () => {
    if (stars < 1 || submitting) return;
    setSubmitting(true);
    try {
      await ratingService.submit({ rideId, stars, comment, compliments, tip });
      toast.success(tip > 0 ? "Thanks — rating and tip sent" : "Thanks for your rating");
      setVisible(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="space-y-4">
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rate your trip</p>
          <p className="font-display text-lg text-foreground">
            How was your ride{driverName ? ` with ${driverName}` : ""}?
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setStars(n)}
              className="p-1"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  n <= stars ? "fill-primary text-primary" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>

        {stars > 0 && (
          <>
            {/* Compliments */}
            <div className="flex flex-wrap justify-center gap-2">
              {COMPLIMENT_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCompliment(id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    compliments.includes(id)
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="Anything else? (optional)"
              className="w-full resize-none rounded-2xl border border-border/70 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />

            {/* Tip (passenger only) */}
            {canTip && (
              <div className="space-y-2">
                <p className="text-center text-xs text-muted-foreground">
                  Add a tip? 100% goes to your driver.
                </p>
                <div className="flex justify-center gap-2">
                  {TIP_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTip((cur) => (cur === amount ? 0 : amount))}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        tip === amount
                          ? "border-primary bg-primary/15 font-semibold text-primary"
                          : "border-border/70 text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="w-full rounded-2xl bg-gradient-pink py-3 text-sm font-semibold text-noir disabled:opacity-60"
            >
              {submitting
                ? "Sending…"
                : tip > 0
                  ? `Submit rating + ${formatCurrency(tip)} tip`
                  : "Submit rating"}
            </button>
          </>
        )}
      </GlassCard>
    </motion.div>
  );
}
