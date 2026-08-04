import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock3, FileImage, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Container, GlassCard, PageHeader, ScreenWrapper } from "@/components/common";
import { FormField } from "@/features/auth/components/FormField";
import { PrimaryButton } from "@/features/auth/components/PrimaryButton";
import {
  riderVerificationService,
  verificationBlocksBooking,
  type RiderVerificationState,
} from "@/services/rider-verification";
import { useT } from "@/i18n";

export const VERIFICATION_KEY = ["rider-verification"] as const;

/**
 * Rider identity verification.
 *
 * HeRide is women-only, and until now that rested on a box someone ticked at
 * signup. This is where she proves it — the same ID-plus-selfie check her
 * driver already passed, reviewed by a person rather than a script.
 */
export function VerifyIdentityScreen() {
  const { t } = useT();
  const { data: state, isLoading } = useQuery({
    queryKey: VERIFICATION_KEY,
    queryFn: () => riderVerificationService.getState(),
  });

  return (
    <ScreenWrapper>
      <Container className="space-y-6 pb-16">
        <PageHeader
          eyebrow={t("profile.account")}
          title={t("verification.title")}
          subtitle={t("verification.subtitle")}
        />
        {isLoading || !state ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : state.isVerified || state.status === "pending" ? (
          <StatusCard state={state} />
        ) : (
          <VerificationForm state={state} />
        )}
      </Container>
    </ScreenWrapper>
  );
}

function StatusCard({ state }: { readonly state: RiderVerificationState }) {
  const { t } = useT();
  const verified = state.isVerified;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="space-y-3 text-center">
        <div
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
            verified ? "bg-primary/15 text-primary" : "bg-card text-muted-foreground"
          }`}
        >
          {verified ? <BadgeCheck className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
        </div>
        <p className="font-display text-xl text-foreground">
          {verified ? t("verification.verified") : t("verification.underReview")}
        </p>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          {verified ? t("verification.verifiedBody") : t("verification.underReviewBody")}
        </p>
        {state.submittedAt && !verified && (
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(state.submittedAt).toLocaleString("en-KE")}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}

function VerificationForm({ state }: { readonly state: RiderVerificationState }) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const blocked = verificationBlocksBooking(state);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfie || !idDoc) {
      toast.error("Both photos are needed");
      return;
    }
    setSubmitting(true);
    try {
      const [selfieUrl, idDocumentUrl] = await Promise.all([
        riderVerificationService.uploadDocument("selfie", selfie),
        riderVerificationService.uploadDocument("id", idDoc),
      ]);
      await riderVerificationService.submit({
        selfieUrl,
        idDocumentUrl,
        idNumber: idNumber.trim() || undefined,
      });
      toast.success("Documents submitted — we'll review them shortly");
      await queryClient.invalidateQueries({ queryKey: VERIFICATION_KEY });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your documents");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {state.status === "rejected" && state.rejectReason && (
        <GlassCard className="flex items-start gap-3 border-destructive/40">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-foreground">We couldn&apos;t verify that</p>
            <p className="text-sm text-muted-foreground">{state.rejectReason}</p>
          </div>
        </GlassCard>
      )}

      {state.required && (
        <GlassCard className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            {blocked
              ? t("verification.required")
              : state.ridesRemaining === 1
                ? t("verification.ridesRemainingOne")
                : t("verification.ridesRemaining", { count: state.ridesRemaining })}
          </p>
        </GlassCard>
      )}

      <GlassCard className="space-y-4">
        <PhotoField
          id="rider-selfie"
          label={t("verification.selfieLabel")}
          file={selfie}
          onFile={setSelfie}
        />
        <PhotoField
          id="rider-id"
          label={t("verification.idLabel")}
          file={idDoc}
          onFile={setIdDoc}
        />
        <FormField
          label={t("verification.idNumberLabel")}
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="12345678"
        />
      </GlassCard>

      <GlassCard className="space-y-2">
        <p className="text-sm font-semibold text-foreground">What happens to these photos</p>
        <p className="text-sm text-muted-foreground">{t("verification.photoNote")}</p>
      </GlassCard>

      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? t("verification.submitting") : t("verification.submit")}
      </PrimaryButton>
    </form>
  );
}

function PhotoField({
  label,
  file,
  onFile,
  id,
}: {
  readonly label: string;
  readonly file: File | null;
  readonly onFile: (f: File | null) => void;
  readonly id: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-3 text-sm text-muted-foreground hover:border-primary/60"
      >
        <FileImage className="h-4 w-4 text-primary" />
        <span className="min-w-0 flex-1 truncate">{file ? file.name : "Tap to add a photo"}</span>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onFile(null);
            }}
            className="text-xs text-destructive"
          >
            Remove
          </button>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
