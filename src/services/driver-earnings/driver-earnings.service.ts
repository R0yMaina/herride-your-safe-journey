export interface DriverEarnings {
  readonly today: number;
  readonly week: number;
  readonly lifetime: number;
  readonly tripsToday: number;
  readonly tripsWeek: number;
  readonly tripsLifetime: number;
  readonly tipsWeek: number;
  readonly commissionWeek: number;
  readonly currency: string;
}

export interface IDriverEarningsService {
  /** Today / this week / lifetime earnings for the signed-in driver. */
  getEarnings(): Promise<DriverEarnings>;
}

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

export class MockDriverEarningsService implements IDriverEarningsService {
  async getEarnings(): Promise<DriverEarnings> {
    await delay();
    return {
      today: 2450,
      week: 14800,
      lifetime: 128400,
      tripsToday: 6,
      tripsWeek: 34,
      tripsLifetime: 291,
      tipsWeek: 950,
      commissionWeek: 1644,
      currency: "KES",
    };
  }
}
