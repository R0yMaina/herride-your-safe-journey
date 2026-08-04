import { env } from "@/config/env";
import { MockRiderVerificationService } from "./rider-verification.service";
import type { IRiderVerificationService } from "./rider-verification.service";
import { SupabaseRiderVerificationService } from "./supabase-rider-verification.service";

export const riderVerificationService: IRiderVerificationService = env.useMocks
  ? new MockRiderVerificationService()
  : new SupabaseRiderVerificationService();

export { verificationBlocksBooking } from "./rider-verification.service";

export type {
  IRiderVerificationService,
  PendingRiderVerification,
  RiderVerificationInput,
  RiderVerificationState,
  RiderVerificationStatus,
} from "./rider-verification.service";
