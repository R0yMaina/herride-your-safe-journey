import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  AuthSession,
  PhoneVerificationChallenge,
  SignInPayload,
  SignUpPayload,
} from "@/types/auth";
import type { IAuthService } from "./auth.service";
import { tokenService } from "./token.service";
import { buildAuthSessionShape, mapSupabaseUser } from "./user-mapper";

/**
 * Thrown by signUp when Supabase requires email confirmation before issuing
 * a session. Callers should treat this as success-with-followup, not failure.
 */
export class EmailVerificationPendingError extends Error {
  constructor(readonly email: string) {
    super("Account created — check your inbox to verify your email, then sign in.");
    this.name = "EmailVerificationPendingError";
  }
}

/** Loads profile + roles for the session user and assembles an AuthSession. */
export async function buildAuthSession(session: Session, rememberMe = true): Promise<AuthSession> {
  const userId = session.user.id;
  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  // Tolerate read failures (e.g. immediately after signup before the
  // handle_new_user trigger commits) — metadata fallbacks cover the gap.
  const profile = profileResult.error ? null : profileResult.data;
  const roles = rolesResult.error ? [] : (rolesResult.data ?? []).map((r) => r.role);
  const user = mapSupabaseUser(session.user, profile, roles);
  return buildAuthSessionShape(session, user, rememberMe);
}

export class SupabaseAuthService implements IAuthService {
  async signIn({ email, password, rememberMe }: SignInPayload): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const session = await buildAuthSession(data.session, rememberMe);
    tokenService.set(session.tokens);
    return session;
  }

  async signUp(payload: SignUpPayload): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        // handle_new_user trigger reads these keys to seed profiles/user_roles.
        data: {
          full_name: `${payload.firstName} ${payload.lastName}`.trim(),
          phone: payload.phone,
          gender: payload.gender,
          country: payload.country,
        },
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/auth/sign-in` : undefined,
      },
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new EmailVerificationPendingError(payload.email);
    const session = await buildAuthSession(data.session);
    tokenService.set(session.tokens);
    return session;
  }

  async requestPhoneOtp(phone: string): Promise<PhoneVerificationChallenge> {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(error.message);
    return {
      // verifyOtp needs the phone number back, and the IAuthService contract
      // only passes verificationId through — so the id carries the phone.
      verificationId: phone,
      phone,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };
  }

  async verifyPhoneOtp(verificationId: string, code: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      phone: verificationId,
      token: code,
      type: "sms",
    });
    if (error) throw new Error(error.message);
  }

  async requestEmailVerification(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw new Error(error.message);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  }

  async resetPassword(_token: string, newPassword: string): Promise<void> {
    // The recovery token arrives in the URL and is consumed by the Supabase
    // client (detectSessionInUrl), so only the new password is needed here.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    tokenService.clear();
    if (error) throw new Error(error.message);
  }
}
