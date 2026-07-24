import type { RideRecord } from "@/types/ride";

export type RideSubscription = { unsubscribe: () => void };

/**
 * Reads and live-watches ride rows for the current user (passenger or driver).
 * Interface-first so screens don't depend on Supabase directly.
 */
export interface IRidesService {
  listMine(): Promise<readonly RideRecord[]>;
  getById(id: string): Promise<RideRecord | null>;
  /** Subscribe to row-level changes for a single ride (accept/status/etc). */
  subscribe(id: string, onChange: (ride: RideRecord) => void): RideSubscription;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

export class MockRidesService implements IRidesService {
  async listMine(): Promise<readonly RideRecord[]> {
    await delay();
    return [];
  }
  async getById(): Promise<RideRecord | null> {
    await delay();
    return null;
  }
  subscribe(): RideSubscription {
    return { unsubscribe: () => {} };
  }
}
