import { env } from "@/config/env";
import { MockDriverService, type IDriverService } from "./driver.service";
import { SupabaseDriverService } from "./supabase-driver.service";

export const driverService: IDriverService = env.useMocks
  ? new MockDriverService()
  : new SupabaseDriverService();

export type {
  IDriverService,
  DriverLocationPing,
  DriverLiveLocation,
  PublicDriver,
  NearbyDriver,
  RideOffer,
} from "./driver.service";
