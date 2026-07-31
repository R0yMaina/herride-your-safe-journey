import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, IdCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Container,
  EmptyState,
  GlassCard,
  PageHeader,
  ScreenWrapper,
  Section,
} from "@/components/common";
import {
  riderVerificationService,
  type PendingRiderVerification,
} from "@/services/rider-verification";

const QUEUE_KEY = ["admin", "rider-verifications"] as const;

/**
 * Rider verification desk.
 *
 * The whole product rests on one judgement made here: does this ID belong to
 * this face, and is she a woman. There is no face-match provider wired in, so
 * a person makes that call — which is slower, and honest about being slow.
 */
export function AdminRidersScreen() {
  const queryClient = useQueryClient();
  const { data: queue, isLoading } = useQuery({
    queryKey: QUEUE_KEY,
    queryFn: () => riderVerificationService.listPending(),
  });

  const act = async (row: PendingRiderVerification, approve: boolean, reason?: string) => {
    try {
      await riderVerificationService.review(row.id, approve, reason);
      toast.success(approve ? `${row.fullName ?? "Rider"} verified` : "Verification rejected");
      await queryClient.invalidateQueries({ queryKey: QUEUE_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not review this submission");
    }
  };

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Admin" title="Rider verification" />

        <GlassCard className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Approve only if the selfie matches the ID, the ID belongs to her, and she is a woman.
            Approving is what lets her into a driver&apos;s car — reject anything you are unsure
            about, with a reason she can act on.
          </p>
        </GlassCard>

        {isLoading ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (queue ?? []).length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            description="New rider submissions appear here for review."
          />
        ) : (
          <Section title={`${queue!.length} waiting`}>
            <div className="space-y-3">
              {queue!.map((row) => (
                <VerificationCard key={row.id} row={row} onAct={act} />
              ))}
            </div>
          </Section>
        )}
      </Container>
    </ScreenWrapper>
  );
}

function VerificationCard({
  row,
  onAct,
}: {
  readonly row: PendingRiderVerification;
  readonly onAct: (row: PendingRiderVerification, approve: boolean, reason?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const openDoc = async (path: string) => {
    const url = await riderVerificationService.documentUrl(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.error("Could not open document");
  };

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <IdCard className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base text-foreground">
            {row.fullName ?? "Unnamed rider"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.phone ?? "No phone"} · declared {row.gender ?? "—"} · submitted{" "}
            {new Date(row.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {row.idNumber && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">ID number</span>
          <span className="font-medium text-foreground">{row.idNumber}</span>
        </div>
      )}

      <div className="flex gap-2">
        <DocButton label="Selfie" onOpen={() => void openDoc(row.selfieUrl)} />
        <DocButton label="ID photo" onOpen={() => void openDoc(row.idDocumentUrl)} />
      </div>

      {rejecting ? (
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
                onAct(row, false, reason || "The photos did not match — please try again")
              }
              className="flex-1 rounded-2xl bg-destructive/15 py-2.5 text-sm font-semibold text-destructive"
            >
              Confirm reject
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
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
            onClick={() => onAct(row, true)}
            className="flex-1 rounded-2xl bg-gradient-pink py-2.5 text-sm font-semibold text-noir"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="rounded-2xl border border-border/70 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive"
          >
            Reject
          </button>
        </div>
      )}
    </GlassCard>
  );
}

function DocButton({ label, onOpen }: { readonly label: string; readonly onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/70 py-2 text-xs text-muted-foreground"
    >
      <Eye className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
