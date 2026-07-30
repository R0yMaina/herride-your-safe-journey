import { env } from "@/config/env";
import {
  MockDriverOnboardingService,
  type IDriverOnboardingService,
} from "./driver-onboarding.service";
import { SupabaseDriverOnboardingService } from "./supabase-driver-onboarding.service";

export const driverOnboardingService: IDriverOnboardingService = env.useMocks
  ? new MockDriverOnboardingService()
  : new SupabaseDriverOnboardingService();

export type {
  DriverApplication,
  DriverApplicationInput,
  DriverApplicationStatus,
  DriverCheckState,
  IDriverOnboardingService,
} from "./driver-onboarding.service";
