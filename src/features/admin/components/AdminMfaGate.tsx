import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper } from "@/components/common";
import { LoadingScreen } from "@/features/common/LoadingScreen";
import { mfaService, type MfaEnrolment, type MfaStatus } from "@/services/auth";

/**
 * Stands between an admin and the console until this session has presented a
 * second factor.
 *
 * An admin can read every rider's trips, see every driver's national ID and
 * move money through the finance screens. A password alone is not a
 * proportionate guard on that, and it is the one account an attacker would
 * actually go after.
 *
 * Two states: enrol (no authenticator yet) and step up (has one, this session
 * hasn't used it). Both end at aal2.
 */
export function AdminMfaGate({ children }: { readonly children: ReactNode }) {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [enrolment, setEnrolment] = useState<MfaEnrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await mfaService.getStatus());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not check your security settings");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!status) return <LoadingScreen />;
  if (status.current === "aal2") return <>{children}</>;

  const startEnrolment = async () => {
    setBusy(true);
    try {
      setEnrolment(await mfaService.enroll());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start setup");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      // Enrolling verifies the NEW factor; stepping up challenges the one she
      // already has. Enrolling again in the step-up case would silently add a
      // second authenticator instead of proving she holds the first.
      const factorId = enrolment?.factorId ?? status.verifiedFactorId ?? status.pendingFactorId;
      if (!factorId) throw new Error("No authenticator found — set one up first");
      await mfaService.verify(factorId, code);
      toast.success("Verified");
      setCode("");
      setEnrolment(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not verify that code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title={status.enrolled ? "Confirm it's you" : "Protect this console"}
          subtitle={
            status.enrolled
              ? "Enter the current code from your authenticator app."
              : "The admin console can read every rider's data. It needs more than a password."
          }
        />

        {!status.enrolled && !enrolment && (
          <GlassCard className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You&apos;ll need an authenticator app — Google Authenticator, 1Password, Authy or
                similar. Setup takes about a minute and is only needed once per device.
              </p>
            </div>
            <button
              type="button"
              onClick={startEnrolment}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-pink px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Set up two-factor
            </button>
          </GlassCard>
        )}

        {enrolment && (
          <GlassCard className="space-y-3 py-4">
            <p className="text-sm text-foreground">Scan this with your authenticator app</p>
            {/* Supabase returns the QR as an SVG data URI. */}
            <img
              src={enrolment.qrSvg}
              alt="Two-factor setup QR code"
              className="mx-auto h-48 w-48 rounded-xl bg-white p-2"
            />
            <p className="text-xs text-muted-foreground">
              Can&apos;t scan? Enter this key instead:
            </p>
            <code className="block break-all rounded-lg bg-background/70 px-3 py-2 text-xs text-foreground">
              {enrolment.secret}
            </code>
          </GlassCard>
        )}

        {(enrolment || status.enrolled) && (
          <GlassCard className="space-y-3 py-4">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                6-digit code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="mt-1 w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-foreground outline-none focus:border-primary"
              />
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={code.length !== 6 || busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-pink px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Verifying…" : "Verify"}
            </button>
          </GlassCard>
        )}
      </Container>
    </ScreenWrapper>
  );
}
