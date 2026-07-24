import type { User } from "@/types/user";
import type { AuthTokens } from "@/types/auth";

export function mockUser(overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    email: "amara@example.com",
    phone: "+254700000000",
    role: "passenger",
    permissions: ["ride:book", "user:read"],
    profile: {
      firstName: "Amara",
      lastName: "Njeri",
      country: "KE",
      emergencyContacts: [],
    },
    preferences: { locale: "en-KE", currency: "KES", theme: "dark" },
    notifications: { push: true, email: true, sms: true, promotions: false },
    security: { twoFactorEnabled: false, biometricEnabled: false, trustedDevices: [] },
    verification: { email: "verified", phone: "verified", identity: "unverified" },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function mockTokens(): AuthTokens {
  return {
    accessToken: `mock.${crypto.randomUUID()}`,
    refreshToken: `mock.${crypto.randomUUID()}`,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

export const delay = (ms = 600) => new Promise<void>((r) => setTimeout(r, ms));
