import { env } from "@/config/env";
import { MockAuthService, type IAuthService } from "./auth.service";
import { SupabaseAuthService } from "./supabase-auth.service";
import { MockVerificationService, type IVerificationService } from "./verification.service";
import { SupabaseVerificationService } from "./supabase-verification.service";

/**
 * Service selection happens here and only here. Set VITE_USE_MOCKS=true to
 * develop UI against in-memory mocks; the default is the real Supabase stack.
 */
export const authService: IAuthService = env.useMocks
  ? new MockAuthService()
  : new SupabaseAuthService();

export const verificationService: IVerificationService = env.useMocks
  ? new MockVerificationService()
  : new SupabaseVerificationService();

export type { IAuthService } from "./auth.service";
export type { IVerificationService } from "./verification.service";
export { EmailVerificationPendingError } from "./supabase-auth.service";
export { initAuthSync } from "./auth-bootstrap";
export { userService, type IUserService } from "./user.service";
export { sessionService } from "./session.service";
export { tokenService } from "./token.service";
