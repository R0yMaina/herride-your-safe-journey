import { supabase } from "@/integrations/supabase/client";

/**
 * How strongly the current session is authenticated.
 *
 * `aal1` is password-only. `aal2` means a second factor was presented in this
 * session — which is the thing the admin console actually needs, since an
 * admin can read every rider's data and see every driver's ID document.
 */
export type AssuranceLevel = "aal1" | "aal2";

export interface MfaStatus {
  /** What this session has proved so far. */
  readonly current: AssuranceLevel;
  /** What it could reach — `aal2` only once a factor is enrolled. */
  readonly next: AssuranceLevel;
  /** True when a verified authenticator already exists on the account. */
  readonly enrolled: boolean;
  /** The verified factor to challenge when stepping a session up to aal2. */
  readonly verifiedFactorId: string | null;
  /** Set while an enrolment is started but not yet verified. */
  readonly pendingFactorId: string | null;
}

export interface MfaEnrolment {
  readonly factorId: string;
  /** SVG of the QR code, ready to render inline. */
  readonly qrSvg: string;
  /** The same secret as text, for authenticators that cannot scan. */
  readonly secret: string;
}

export interface IMfaService {
  getStatus(): Promise<MfaStatus>;
  /** Begin TOTP enrolment. Not active until `verify` succeeds. */
  enroll(): Promise<MfaEnrolment>;
  /** Confirm a 6-digit code — completes enrolment, or steps a session up to aal2. */
  verify(factorId: string, code: string): Promise<void>;
  /** Remove a factor. Only useful for recovering a lost authenticator. */
  unenroll(factorId: string): Promise<void>;
}

export class SupabaseMfaService implements IMfaService {
  async getStatus(): Promise<MfaStatus> {
    const [{ data: aal, error: aalError }, { data: factors, error: factorError }] =
      await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
    if (aalError) throw new Error(aalError.message);
    if (factorError) throw new Error(factorError.message);

    const all = factors?.all ?? [];
    const verified = all.filter((f) => f.status === "verified");
    // An enrolment that was started and abandoned would otherwise block a
    // retry, because Supabase refuses a second factor with the same name.
    const pending = all.find((f) => f.status === "unverified") ?? null;

    return {
      current: (aal?.currentLevel as AssuranceLevel) ?? "aal1",
      next: (aal?.nextLevel as AssuranceLevel) ?? "aal1",
      enrolled: verified.length > 0,
      verifiedFactorId: verified[0]?.id ?? null,
      pendingFactorId: pending?.id ?? null,
    };
  }

  async enroll(): Promise<MfaEnrolment> {
    // Clear an abandoned attempt first, or enrolment fails on the duplicate.
    const { pendingFactorId } = await this.getStatus();
    if (pendingFactorId) await this.unenroll(pendingFactorId);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "HeRide admin",
    });
    if (error) throw new Error(error.message);
    return {
      factorId: data.id,
      qrSvg: data.totp.qr_code,
      secret: data.totp.secret,
    };
  }

  async verify(factorId: string, code: string): Promise<void> {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError) throw new Error(challengeError.message);

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    // Supabase's message for a wrong code is unhelpfully generic; say the one
    // thing that is actually usually true.
    if (error) {
      throw new Error(
        /invalid|incorrect/i.test(error.message)
          ? "That code didn't match. Codes expire every 30 seconds — try the current one."
          : error.message,
      );
    }
  }

  async unenroll(factorId: string): Promise<void> {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message);
  }
}

/**
 * Mock: reports an account that already satisfies aal2, so the admin console
 * stays reachable in `useMocks` mode without a real authenticator app.
 */
export class MockMfaService implements IMfaService {
  async getStatus(): Promise<MfaStatus> {
    return {
      current: "aal2",
      next: "aal2",
      enrolled: true,
      verifiedFactorId: "mock-factor",
      pendingFactorId: null,
    };
  }
  async enroll(): Promise<MfaEnrolment> {
    return {
      factorId: "mock-factor",
      qrSvg: "<svg xmlns='http://www.w3.org/2000/svg'/>",
      secret: "MOCKSECRET",
    };
  }
  async verify(): Promise<void> {}
  async unenroll(): Promise<void> {}
}
