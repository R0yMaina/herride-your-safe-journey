import type { ID, ISODateString } from "./global";

export type UserRole = "passenger" | "driver" | "admin" | "support";

export type Permission =
  | "ride:book"
  | "ride:manage"
  | "user:read"
  | "user:manage"
  | "support:respond"
  | "admin:full";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface EmergencyContact {
  readonly id: ID;
  readonly name: string;
  readonly phone: string;
  readonly relation?: string;
}

export interface NotificationSettings {
  readonly push: boolean;
  readonly email: boolean;
  readonly sms: boolean;
  readonly promotions: boolean;
}

export interface SecuritySettings {
  readonly twoFactorEnabled: boolean;
  readonly biometricEnabled: boolean;
  readonly trustedDevices: readonly string[];
}

export interface UserPreferences {
  readonly locale: string;
  readonly currency: string;
  readonly theme: "dark" | "light" | "system";
}

export interface UserProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly avatarUrl?: string;
  readonly country: string;
  readonly dateOfBirth?: ISODateString;
  readonly emergencyContacts: readonly EmergencyContact[];
}

export interface UserVerification {
  readonly email: VerificationStatus;
  readonly phone: VerificationStatus;
  readonly identity: VerificationStatus;
}

/** Future: extend for driver-specific fields (vehicle, license, ratings). */
export interface DriverProfile {
  readonly userId: ID;
  readonly licenseNumber: string;
  readonly vehicleId: ID;
  readonly rating: number;
  readonly onboardingComplete: boolean;
}

export interface User {
  readonly id: ID;
  readonly email: string;
  readonly phone: string;
  readonly role: UserRole;
  readonly permissions: readonly Permission[];
  readonly profile: UserProfile;
  readonly preferences: UserPreferences;
  readonly notifications: NotificationSettings;
  readonly security: SecuritySettings;
  readonly verification: UserVerification;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}
