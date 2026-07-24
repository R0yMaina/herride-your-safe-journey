import type { ISODateString } from "./global";
import type { User } from "./user";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "session-expired";

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: ISODateString;
}

export interface AuthSession {
  readonly user: User;
  readonly tokens: AuthTokens;
  readonly rememberMe: boolean;
}

export interface SignInPayload {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}

export type Gender = "female" | "male" | "other";

export interface SignUpPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly country: string;
  /** Required by the backend: rides are restricted to female passengers. */
  readonly gender: Gender;
  readonly acceptTerms: boolean;
  readonly acceptPrivacy: boolean;
}

export interface PhoneVerificationChallenge {
  readonly verificationId: string;
  readonly phone: string;
  readonly expiresAt: ISODateString;
}
