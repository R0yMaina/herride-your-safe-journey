import { env } from "@/config/env";
import { MockRideRequestService, type IRideRequestService } from "./ride-request.service";
import { SupabaseRideRequestService } from "./supabase-ride-request.service";
import { MockRidesService, type IRidesService } from "./rides.service";
import { SupabaseRidesService } from "./supabase-rides.service";

export { vehicleService, type IVehicleService } from "./vehicle.service";
export { fareService, type IFareService } from "./fare.service";
export { tripService, type ITripService } from "./trip.service";
export { scheduleService, type IScheduleService } from "./schedule.service";

export const rideRequestService: IRideRequestService = env.useMocks
  ? new MockRideRequestService()
  : new SupabaseRideRequestService();

export const ridesService: IRidesService = env.useMocks
  ? new MockRidesService()
  : new SupabaseRidesService();

export type { IRideRequestService } from "./ride-request.service";
export type { IRidesService, RideSubscription } from "./rides.service";
