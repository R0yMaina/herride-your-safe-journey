import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Eye, IdCard, ShieldCheck, UserX } from "lucide-react";
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
  adminDriversService,
  type DriverApplicationSummary,
  type DriverVerificationStatus,
} from "@/services/admin-drivers";

const TABS: readonly { id: DriverVerificationStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
  { id: "suspended", label: "Suspended" },
];

/**
 * The verification desk (HerShield layer 1, admin side). Every HeRide driver
 * passes through here: her licence, national ID and identity photos are
 * checked by a human before the driver role is granted. Approving grants the
 * role; rejecting or suspending revokes it — all server-side, all audited.
 */
export function AdminDriversScreen() {
  const [tab, setTab] = useState<DriverVerificationStatus>("pending");
  const queryClient = useQueryClient();
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin", "driver-applications", tab],
    queryFn: () => adminDriversService.list(tab),
  });

  const act = async (
    application: DriverApplicationSummary,
    status: DriverVerificationStatus,
    reason?: string,
  ) => {
    try {
      await adminDriversService.setStatus(application.userId, status, reason);
      toast.success(
        status === "verified"
          ? `${application.fullName ?? "Driver"} approved — she can go online now`
          : `Application ${status}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "driver-applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update application");
    }
  };

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Admin" title="Driver verification" />

        <GlassCard className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Every driver is verified by hand before she can carry a rider. Check that the selfie
            matches the ID, the ID is hers, and the licence is valid.
          </p>
        </GlassCard>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                tab === id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/70 text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (applications ?? []).length === 0 ? (
          <EmptyState
            title={`No ${tab} applications`}
            description={
              tab === "pending" ? "New driver applications will appear here for review." : undefined
            }
          />
        ) : (
          <Section title={`${applications!.length} ${tab}`}>
            <div className="space-y-3">
              {applications!.map((application) => (
                <ApplicationCard key={application.userId} application={application} onAct={act} />
              ))}
            </div>
          </Section>
        )}
      </Container>
    </ScreenWrapper>
  );
}

function ApplicationCard({
  application,
  onAct,
}: {
  readonly application: DriverApplicationSummary;
  readonly onAct: (
    a: DriverApplicationSummary,
    status: DriverVerificationStatus,
    reason?: string,
  ) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const pending = application.status === "pending";
  const verified = application.status === "verified";

  const openDoc = async (path: string | null) => {
    if (!path) return;
    const url = await adminDriversService.getDocumentUrl(path);
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
          <p className="flex items-center gap-1.5 truncate font-display text-base text-foreground">
            {application.fullName ?? "Unnamed applicant"}
            {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {application.phone ?? "No phone"} · applied{" "}
            {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <Detail label="Licence" value={application.licenseNumber} />
        <Detail label="National ID" value={application.nationalId} />
        <Detail
          label="Vehicle"
          value={`${application.vehicle}${application.vehicleColor ? ` · ${application.vehicleColor}` : ""}`}
        />
        <Detail label="Plate" value={application.vehiclePlate ?? "—"} />
      </div>

      <div className="flex gap-2">
        <DocButton
          label="Selfie"
          path={application.selfieUrl}
          onOpen={() => void openDoc(application.selfieUrl)}
        />
        <DocButton
          label="ID photo"
          path={application.idDocumentUrl}
          onOpen={() => void openDoc(application.idDocumentUrl)}
        />
      </div>

      {application.rejectionReason && (
        <p className="text-xs text-destructive">Reason: {application.rejectionReason}</p>
      )}

      {pending &&
        (rejecting ? (
          <div className="space-y-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (shown to the applicant)"
              className="w-full rounded-2xl border border-border/70 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onAct(application, "rejected", reason || "Documents could not be verified")
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
              onClick={() => onAct(application, "verified")}
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
        ))}

      {verified && (
        <button
          type="button"
          onClick={() => onAct(application, "suspended", "Suspended by admin review")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 py-2.5 text-sm text-muted-foreground hover:text-destructive"
        >
          <UserX className="h-4 w-4" /> Suspend driver
        </button>
      )}
    </GlassCard>
  );
}

function Detail({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function DocButton({
  label,
  path,
  onOpen,
}: {
  readonly label: string;
  readonly path: string | null;
  readonly onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!path}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/70 py-2 text-xs text-muted-foreground disabled:opacity-40"
    >
      <Eye className="h-3.5 w-3.5" />
      {path ? label : `${label} missing`}
    </button>
  );
}
