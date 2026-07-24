import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { AuthSession, AuthTokens } from "@/types/auth";
import type { Permission, User, UserRole, VerificationStatus } from "@/types/user";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  passenger: ["ride:book", "user:read"],
  driver: ["ride:book", "ride:manage", "user:read"],
  admin: ["ride:book", "ride:manage", "user:read", "user:manage", "admin:full"],
  support: ["user:read", "support:respond"],
};

/** Highest-privilege role wins when a user holds several. */
export function resolveRole(roles: readonly AppRole[]): UserRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("driver")) return "driver";
  return "passenger";
}

function verificationStatus(confirmedAt: string | null | undefined): VerificationStatus {
  return confirmedAt ? "verified" : "pending";
}

function splitFullName(fullName: string | null): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

/**
 * Maps a Supabase auth user + profiles row + user_roles rows onto the app's
 * User shape. Fields the backend doesn't model yet (preferences, security)
 * get stable defaults so the rest of the app stays unchanged.
 */
export function mapSupabaseUser(
  supabaseUser: SupabaseUser,
  profile: ProfileRow | null,
  roles: readonly AppRole[],
): User {
  const role = resolveRole(roles);
  const meta = supabaseUser.user_metadata ?? {};
  const { firstName, lastName } = splitFullName(
    profile?.full_name ?? (typeof meta.full_name === "string" ? meta.full_name : null),
  );
  const now = new Date().toISOString();

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    phone: profile?.phone ?? supabaseUser.phone ?? "",
    role,
    permissions: ROLE_PERMISSIONS[role],
    profile: {
      firstName,
      lastName,
      avatarUrl: profile?.avatar_url ?? undefined,
      country: typeof meta.country === "string" ? meta.country : "KE",
      dateOfBirth: profile?.date_of_birth ?? undefined,
      emergencyContacts: [],
    },
    preferences: { locale: "en-KE", currency: "KES", theme: "dark" },
    notifications: { push: true, email: true, sms: true, promotions: false },
    security: { twoFactorEnabled: false, biometricEnabled: false, trustedDevices: [] },
    verification: {
      email: verificationStatus(supabaseUser.email_confirmed_at),
      phone: supabaseUser.phone_confirmed_at ? "verified" : "unverified",
      identity: "unverified",
    },
    createdAt: supabaseUser.created_at ?? now,
    updatedAt: supabaseUser.updated_at ?? now,
  };
}

export function mapSupabaseTokens(session: Session): AuthTokens {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
  };
}

export function buildAuthSessionShape(
  session: Session,
  user: User,
  rememberMe = true,
): AuthSession {
  return { user, tokens: mapSupabaseTokens(session), rememberMe };
}
