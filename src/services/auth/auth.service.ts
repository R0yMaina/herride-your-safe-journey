import type {
  AuthSession,
  PhoneVerificationChallenge,
  SignInPayload,
  SignUpPayload,
} from "@/types/auth";
import { delay, mockTokens, mockUser } from "./mock-data";
import { tokenService } from "./token.service";

/**
 * Mock AuthService. Swap the implementation with real API calls in future
 * phases — the public surface must not change so features stay untouched.
 */
export interface IAuthService {
  signIn(payload: SignInPayload): Promise<AuthSession>;
  signUp(payload: SignUpPayload): Promise<AuthSession>;
  requestPhoneOtp(phone: string): Promise<PhoneVerificationChallenge>;
  verifyPhoneOtp(verificationId: string, code: string): Promise<void>;
  requestEmailVerification(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
}

export class MockAuthService implements IAuthService {
  async signIn({ email, rememberMe }: SignInPayload): Promise<AuthSession> {
    await delay();
    const tokens = mockTokens();
    tokenService.set(tokens);
    return { user: mockUser({ email }), tokens, rememberMe };
  }

  async signUp(payload: SignUpPayload): Promise<AuthSession> {
    await delay();
    const tokens = mockTokens();
    tokenService.set(tokens);
    return {
      user: mockUser({
        email: payload.email,
        phone: payload.phone,
        profile: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          country: payload.country,
          emergencyContacts: [],
        },
        verification: { email: "pending", phone: "pending", identity: "unverified" },
      }),
      tokens,
      rememberMe: true,
    };
  }

  async requestPhoneOtp(phone: string): Promise<PhoneVerificationChallenge> {
    await delay(400);
    return {
      verificationId: crypto.randomUUID(),
      phone,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };
  }

  async verifyPhoneOtp(_id: string, code: string): Promise<void> {
    await delay(400);
    if (code === "000000") throw new Error("Invalid verification code");
  }

  async requestEmailVerification(_email: string): Promise<void> {
    await delay(400);
  }

  async requestPasswordReset(_email: string): Promise<void> {
    await delay(500);
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    await delay(500);
  }

  async signOut(): Promise<void> {
    await delay(200);
    tokenService.clear();
  }
}
