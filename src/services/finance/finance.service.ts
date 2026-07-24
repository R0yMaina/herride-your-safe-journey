/** Aggregated financials for the admin dashboard. Mirrors get_financial_summary. */
export interface FinancialSummary {
  readonly grossRevenue: number;
  readonly commissionRevenue: number;
  readonly driverEarnings: number;
  readonly refunds: number;
  readonly payoutsPaid: number;
  readonly payoutsPending: number;
  readonly completedRides: number;
  readonly averageFare: number;
  readonly currency: string;
}

export interface IFinanceService {
  /** Admin-only aggregate over the last `days` (default 30). */
  getSummary(days?: number): Promise<FinancialSummary>;
}

const EMPTY: FinancialSummary = {
  grossRevenue: 0,
  commissionRevenue: 0,
  driverEarnings: 0,
  refunds: 0,
  payoutsPaid: 0,
  payoutsPending: 0,
  completedRides: 0,
  averageFare: 0,
  currency: "KES",
};

export class MockFinanceService implements IFinanceService {
  async getSummary(): Promise<FinancialSummary> {
    await new Promise<void>((r) => setTimeout(r, 200));
    return {
      ...EMPTY,
      grossRevenue: 128400,
      commissionRevenue: 25680,
      driverEarnings: 102720,
      refunds: 1060,
      payoutsPaid: 84000,
      payoutsPending: 18720,
      completedRides: 242,
      averageFare: 530.6,
    };
  }
}
