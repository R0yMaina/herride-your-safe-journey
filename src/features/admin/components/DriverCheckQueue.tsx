import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Eye, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, GlassCard, Section } from "@/components/common";
import { adminDriversService, type PendingDriverCheck } from "@/services/admin-drivers";

export const CHECK_QUEUE_KEY = ["admin", "driver-checks"] as const;

/**
 * The periodic identity re-check queue (phase 19, admin side).
 *
 * The gate this clears is unusually harsh by design: a driver whose check is
 * overdue cannot go online *and* cannot be matched. That is correct — an
 * unverified face must not carry a rider — but it means this queue is the only
 * way back. An unstaffed desk locks working drivers out of their income, so
 * the count is shown even when it is zero.
 */
export function DriverCheckQueue() {
  const queryClient = useQueryClient();
  const { data: checks, isLoading } = useQuery({
    queryKey: CHECK_QUEUE_KEY,
    queryFn: () => adminDriversService.listPendingChecks(),
  });

  const review = async (check: PendingDriverCheck, passed: boolean, reason?: string) => {
    try {
      await adminDriversService.reviewCheck(check.id, passed, reason);
      toast.success(
        passed
          ? `${check.fullName ?? "Driver"} cleared — she can go back online`
          : `${check.fullName ?? "Driver"} failed the check and is offline`,
      );
      await queryClient.invalidateQueries({ queryKey: CHECK_QUEUE_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not review this check");
    }
  };

  const count = checks?.length ?? 0;

  return (
    <Section title={count > 0 ? `Identity re-checks · ${count} waiting` : "Identity re-checks"}>
      <GlassCard className="mb-3 flex items-start gap-3">
        <ScanFace className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Compare the new selfie against the photo she was originally approved on — not against her
          last re-check, or an account could drift to a different face a month at a time. A driver
          waiting here cannot work, so clear this queue daily.
        </p>
      </GlassCard>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : count === 0 ? (
        <EmptyState
          icon={<Clock3 className="h-6 w-6" />}
          title="Nothing waiting"
          description="Re-checks appear here as drivers submit them."
        />
      ) : (
        <div className="space-y-3">
          {checks!.map((check) => (
            <CheckCard key={check.id} check={check} onReview={review} />
          ))}
        </div>
      )}
    </Section>
  );
}

function CheckCard({
  check,
  onReview,
}: {
  readonly check: PendingDriverCheck;
  readonly onReview: (check: PendingDriverCheck, passed: boolean, reason?: string) => void;
}) {
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState("");

  const openDoc = async (path: string | null) => {
    if (!path) {
      toast.error("That photo is missing — fail the check and ask her to resubmit");
      return;
    }
    const url = await adminDriversService.getDocumentUrl(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.error("Could not open the photo");
  };

  const overdueDays = check.lastCheckedAt
    ? Math.floor((Date.now() - new Date(check.lastCheckedAt).getTime()) / 86_400_000)
    : null;

  return (
    <GlassCard className="space-y-4">
      <div>
        <p className="font-display text-base text-foreground">
          {check.fullName ?? "Unnamed driver"}
        </p>
        <p className="text-xs text-muted-foreground">
          Submitted {new Date(check.submittedAt).toLocaleString("en-KE")}
          {overdueDays !== null && ` · last checked ${overdueDays} days ago`}
        </p>
      </div>

      <div className="flex gap-2">
        <PhotoButton label="New selfie" onOpen={() => void openDoc(check.selfieUrl)} />
        <PhotoButton
          label={check.verificationSelfieUrl ? "Approved photo" : "Approved photo missing"}
          muted={!check.verificationSelfieUrl}
          onOpen={() => void openDoc(check.verificationSelfieUrl)}
        />
      </div>

      {failing ? (
        <div className="space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to her)"
            className="w-full rounded-2xl border border-border/70 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                onReview(check, false, reason || "We could not match your photo. Contact support.")
              }
              className="flex-1 rounded-2xl bg-destructive/15 py-2.5 text-sm font-semibold text-destructive"
            >
              Confirm fail
            </button>
            <button
              type="button"
              onClick={() => setFailing(false)}
              className="rounded-2xl border border-border/70 px-4 py-2.5 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onReview(check, true)}
            className="flex-1 rounded-2xl bg-gradient-pink py-2.5 text-sm font-semibold text-noir"
          >
            Same person — clear her
          </button>
          <button
            type="button"
            onClick={() => setFailing(true)}
            className="rounded-2xl border border-border/70 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive"
          >
            Fail
          </button>
        </div>
      )}
    </GlassCard>
  );
}

function PhotoButton({
  label,
  onOpen,
  muted,
}: {
  readonly label: string;
  readonly onOpen: () => void;
  readonly muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/70 py-2 text-xs ${
        muted ? "text-destructive/80" : "text-muted-foreground"
      }`}
    >
      <Eye className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
