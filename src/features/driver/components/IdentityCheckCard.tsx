import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScanFace } from "lucide-react";
import { GlassCard } from "@/components/common";
import { driverOnboardingService, type DriverCheckState } from "@/services/driver-onboarding";

interface IdentityCheckCardProps {
  readonly state: DriverCheckState;
  /** Re-read the state after a submission so the gate updates. */
  readonly onSubmitted: () => void;
}

/**
 * Prompts a driver to re-prove her identity when the check is due.
 *
 * This is the visible half of the fix for the product's biggest safety gap:
 * verification used to be permanent, so an account could be lent, sold or
 * shared and nothing would notice. The invisible half is the server refusing to
 * bring her online and excluding her from matching — this card exists so she
 * understands why, and can fix it in two taps.
 */
export function IdentityCheckCard({ state, onSubmitted }: IdentityCheckCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.isCurrent && !state.pendingReview) return null;

  if (state.pendingReview) {
    return (
      <GlassCard className="flex items-start gap-3 border-primary/30">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <ScanFace className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-base text-foreground">Photo under review</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            A person is comparing it against your verification photo. You&apos;ll be able to go back
            online as soon as it passes — usually within a few hours.
          </p>
        </div>
      </GlassCard>
    );
  }

  const submit = async (file: File) => {
    setBusy(true);
    try {
      const path = await driverOnboardingService.uploadDocument("selfie", file);
      await driverOnboardingService.submitCheck(path);
      toast.success("Photo submitted for review");
      onSubmitted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit your photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="flex items-start gap-3 border-primary/40">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
        <ScanFace className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-foreground">Identity check due</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Take a fresh selfie to go back online. Riders trust HeRide because every driver is a
          verified woman — this is how we keep that true for the person actually behind the wheel.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          // Front camera on a phone: the whole point is a photo taken now.
          capture="user"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void submit(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-pink px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
          {busy ? "Submitting…" : "Take selfie"}
        </button>
      </div>
    </GlassCard>
  );
}
