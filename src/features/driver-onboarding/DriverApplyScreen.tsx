import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Car, Clock3, FileImage, IdCard, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Container, GlassCard, PageHeader, ScreenWrapper } from "@/components/common";
import { FormField } from "@/features/auth/components/FormField";
import { PrimaryButton } from "@/features/auth/components/PrimaryButton";
import { driverOnboardingService, type DriverApplication } from "@/services/driver-onboarding";
import { ROUTES } from "@/constants/routes";

const APPLICATION_KEY = ["driver-application"] as const;

/**
 * "Drive with HeRide" — in-app driver application (HerShield layer 1).
 * A signed-in woman submits her licence, national ID, vehicle details and
 * identity photos; the application lands in the admin verification queue as
 * 'pending'. This screen then tracks the outcome: under review, approved
 * (role granted server-side → driver app unlocked), or rejected with the
 * reason and a re-apply path.
 */
export function DriverApplyScreen() {
  const { data: application, isLoading } = useQuery({
    queryKey: APPLICATION_KEY,
    queryFn: () => driverOnboardingService.getMyApplication(),
  });

  return (
    <ScreenWrapper>
      <Container className="space-y-6 pb-16">
        <PageHeader eyebrow="Drive with HeRide" title="Driver application" />
        {isLoading ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : application && application.status !== "rejected" ? (
          <ApplicationStatusCard application={application} />
        ) : (
          <ApplicationForm rejected={application ?? null} />
        )}
      </Container>
    </ScreenWrapper>
  );
}

function ApplicationStatusCard({ application }: { readonly application: DriverApplication }) {
  const navigate = useNavigate();
  const pending = application.status === "pending";
  const verified = application.status === "verified";
  const suspended = application.status === "suspended";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <GlassCard className="space-y-3 text-center">
        <div
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
            verified ? "bg-primary/15 text-primary" : "bg-card text-muted-foreground"
          }`}
        >
          {verified ? (
            <BadgeCheck className="h-7 w-7" />
          ) : suspended ? (
            <XCircle className="h-7 w-7 text-destructive" />
          ) : (
            <Clock3 className="h-7 w-7" />
          )}
        </div>
        <p className="font-display text-xl text-foreground">
          {verified
            ? "You're approved to drive"
            : suspended
              ? "Account suspended"
              : "Application under review"}
        </p>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          {verified
            ? "Welcome to HeRide. Go online whenever you're ready for your first trip."
            : suspended
              ? "Contact support to resolve this."
              : "Our team is verifying your identity and vehicle documents. We notify every applicant — most reviews complete within 48 hours."}
        </p>
        {pending && (
          <p className="text-xs text-muted-foreground/80">
            Applied {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        )}
      </GlassCard>

      <GlassCard className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your vehicle</p>
        <p className="text-sm text-foreground">
          {application.vehicleMake} {application.vehicleModel}
          {application.vehicleColor ? ` · ${application.vehicleColor}` : ""}
          {application.vehicleYear ? ` · ${application.vehicleYear}` : ""}
        </p>
        <p className="text-sm font-semibold text-primary">{application.vehiclePlate}</p>
      </GlassCard>

      {verified && (
        <PrimaryButton onClick={() => void navigate({ to: ROUTES.driver })}>
          Open the driver app
        </PrimaryButton>
      )}
    </motion.div>
  );
}

function ApplicationForm({ rejected }: { readonly rejected: DriverApplication | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    licenseNumber: rejected?.licenseNumber ?? "",
    nationalId: rejected?.nationalId ?? "",
    vehicleMake: rejected?.vehicleMake ?? "",
    vehicleModel: rejected?.vehicleModel ?? "",
    vehiclePlate: rejected?.vehiclePlate ?? "",
    vehicleColor: rejected?.vehicleColor ?? "",
    vehicleYear: rejected?.vehicleYear ? String(rejected.vehicleYear) : "",
  });
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const ready =
    form.licenseNumber.trim().length >= 4 &&
    form.nationalId.trim().length >= 4 &&
    form.vehicleMake.trim() &&
    form.vehicleModel.trim() &&
    form.vehiclePlate.trim().length >= 4;

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    try {
      // Photos upload first (best-effort: the application is reviewable
      // without them, and admins can request them before approving).
      let selfieUrl: string | undefined;
      let idDocumentUrl: string | undefined;
      if (selfie) {
        selfieUrl = await driverOnboardingService
          .uploadDocument("selfie", selfie)
          .catch(() => undefined);
      }
      if (idDoc) {
        idDocumentUrl = await driverOnboardingService
          .uploadDocument("id", idDoc)
          .catch(() => undefined);
      }
      await driverOnboardingService.apply({
        licenseNumber: form.licenseNumber,
        nationalId: form.nationalId,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        vehiclePlate: form.vehiclePlate,
        vehicleColor: form.vehicleColor || undefined,
        vehicleYear: form.vehicleYear ? Number(form.vehicleYear) : undefined,
        selfieUrl,
        idDocumentUrl,
      });
      toast.success("Application submitted — we'll review it shortly");
      await queryClient.invalidateQueries({ queryKey: APPLICATION_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {rejected?.rejectionReason && (
        <GlassCard className="flex items-start gap-3 border-destructive/40">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-foreground">Previous application declined</p>
            <p className="text-xs text-muted-foreground">{rejected.rejectionReason}</p>
            <p className="pt-1 text-xs text-muted-foreground">Fix the issue below and re-submit.</p>
          </div>
        </GlassCard>
      )}

      <GlassCard className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          HeRide drivers are <span className="text-foreground">verified women</span>. We check your
          ID and licence by hand before you can go online — riders trust us because nobody skips
          this step.
        </p>
      </GlassCard>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Identity</p>
        <FormField
          label="Driving licence number"
          leading={<IdCard className="h-4 w-4" />}
          value={form.licenseNumber}
          onChange={set("licenseNumber")}
          placeholder="DL-1234567"
          autoComplete="off"
        />
        <FormField
          label="National ID number"
          leading={<IdCard className="h-4 w-4" />}
          value={form.nationalId}
          onChange={set("nationalId")}
          placeholder="12345678"
          autoComplete="off"
        />
        <DocPicker
          label="Selfie (holding your ID)"
          file={selfie}
          onFile={setSelfie}
          id="doc-selfie"
        />
        <DocPicker label="Photo of your national ID" file={idDoc} onFile={setIdDoc} id="doc-id" />
      </div>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your vehicle</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Make"
            leading={<Car className="h-4 w-4" />}
            value={form.vehicleMake}
            onChange={set("vehicleMake")}
            placeholder="Toyota"
          />
          <FormField
            label="Model"
            value={form.vehicleModel}
            onChange={set("vehicleModel")}
            placeholder="Vitz"
          />
        </div>
        <FormField
          label="Number plate"
          value={form.vehiclePlate}
          onChange={(e) => setForm((f) => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))}
          placeholder="KDA 123A"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Colour (optional)"
            value={form.vehicleColor}
            onChange={set("vehicleColor")}
            placeholder="Silver"
          />
          <FormField
            label="Year (optional)"
            value={form.vehicleYear}
            onChange={set("vehicleYear")}
            placeholder="2018"
            inputMode="numeric"
          />
        </div>
      </div>

      <PrimaryButton loading={submitting} disabled={!ready} onClick={submit}>
        Submit application
      </PrimaryButton>
      <p className="text-center text-[11px] text-muted-foreground">
        By applying you consent to identity verification. Your documents are stored privately and
        seen only by the verification team.
      </p>
    </motion.div>
  );
}

function DocPicker({
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
