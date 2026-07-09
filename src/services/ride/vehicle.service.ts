import type { RideOption } from "@/types/ride";
import { RIDE_OPTIONS } from "@/features/ride-request/data/vehicles";

export interface IVehicleService {
  list(): Promise<readonly RideOption[]>;
  getById(id: RideOption["id"]): Promise<RideOption | null>;
}

const delay = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms));

class MockVehicleService implements IVehicleService {
  async list(): Promise<readonly RideOption[]> {
    await delay();
    return RIDE_OPTIONS;
  }
  async getById(id: RideOption["id"]): Promise<RideOption | null> {
    await delay(80);
    return RIDE_OPTIONS.find((o) => o.id === id) ?? null;
  }
}

export const vehicleService: IVehicleService = new MockVehicleService();