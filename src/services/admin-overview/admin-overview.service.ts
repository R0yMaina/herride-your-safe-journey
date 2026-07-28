export interface AdminOverview {
  readonly pendingDrivers: number;
  readonly verifiedDrivers: number;
  readonly suspendedDrivers: number;
  readonly driversOnline: number;
  readonly activeRides: number;
  readonly ridesToday: number;
  readonly completedToday: number;
  readonly cancelledToday: number;
  readonly grossToday: number;
  readonly commissionToday: number;
  readonly openSos: number;
  readonly openFraudSignals: number;
  readonly passengersTotal: number;
  readonly currency: string;
}

export interface IAdminOverviewService {
  /** Live platform health for the admin dashboard hub. */
  getOverview(): Promise<AdminOverview>;
}

export const EMPTY_OVERVIEW: AdminOverview = {
  pendingDrivers: 0,
  verifiedDrivers: 0,
  suspendedDrivers: 0,
  driversOnline: 0,
  activeRides: 0,
  ridesToday: 0,
  completedToday: 0,
  cancelledToday: 0,
  grossToday: 0,
  commissionToday: 0,
  openSos: 0,
  openFraudSignals: 0,
  passengersTotal: 0,
  currency: "KES",
};

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

export class MockAdminOverviewService implements IAdminOverviewService {
  async getOverview(): Promise<AdminOverview> {
    await delay();
    return EMPTY_OVERVIEW;
  }
}
