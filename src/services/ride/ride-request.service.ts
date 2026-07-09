import type { RideRequestDraft, TripSummary } from "@/types/ride";

export interface IRideRequestService {
  submit(summary: TripSummary): Promise<RideRequestDraft>;
  cancel(requestId: string): Promise<void>;
}

class MockRideRequestService implements IRideRequestService {
  async submit(summary: TripSummary): Promise<RideRequestDraft> {
    await new Promise<void>((r) => setTimeout(r, 500));
    return { id: crypto.randomUUID(), summary, createdAt: new Date().toISOString() };
  }
  async cancel(_requestId: string): Promise<void> {
    await new Promise<void>((r) => setTimeout(r, 250));
  }
}

export const rideRequestService: IRideRequestService = new MockRideRequestService();