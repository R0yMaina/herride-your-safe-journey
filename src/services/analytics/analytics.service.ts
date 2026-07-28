export type ReportBucket = "day" | "week" | "month";

export interface ReportRow {
  readonly period: string;
  readonly grossRevenue: number;
  readonly commissionRevenue: number;
  readonly driverEarnings: number;
  readonly rides: number;
}

export interface TopDriver {
  readonly driverId: string;
  readonly name: string | null;
  readonly rides: number;
  readonly earnings: number;
}

export interface TopCustomer {
  readonly passengerId: string;
  readonly name: string | null;
  readonly rides: number;
  readonly spend: number;
}

export interface TopRoute {
  readonly pickup: string;
  readonly dropoff: string;
  readonly rides: number;
  readonly revenue: number;
}

/**
 * Admin financial analytics — revenue over time (daily/weekly/monthly
 * reports) and top-N leaderboards. All aggregates come from the immutable
 * platform ledger via admin-gated SQL functions.
 */
export interface IAnalyticsService {
  getReport(bucket: ReportBucket, days?: number): Promise<readonly ReportRow[]>;
  getTopDrivers(days?: number, limit?: number): Promise<readonly TopDriver[]>;
  getTopCustomers(days?: number, limit?: number): Promise<readonly TopCustomer[]>;
  getTopRoutes(days?: number, limit?: number): Promise<readonly TopRoute[]>;
}

const delay = (ms = 150) => new Promise<void>((r) => setTimeout(r, ms));

export class MockAnalyticsService implements IAnalyticsService {
  async getReport(): Promise<readonly ReportRow[]> {
    await delay();
    return Array.from({ length: 7 }, (_, i) => ({
      period: new Date(Date.now() - (6 - i) * 86_400_000).toISOString(),
      grossRevenue: 12000 + i * 1500,
      commissionRevenue: 1200 + i * 150,
      driverEarnings: 10800 + i * 1350,
      rides: 20 + i * 3,
    }));
  }
  async getTopDrivers(): Promise<readonly TopDriver[]> {
    await delay();
    return [
      { driverId: "d1", name: "Grace Wanjiku", rides: 48, earnings: 22800 },
      { driverId: "d2", name: "Mercy Achieng", rides: 41, earnings: 19500 },
    ];
  }
  async getTopCustomers(): Promise<readonly TopCustomer[]> {
    await delay();
    return [
      { passengerId: "p1", name: "Amina Njoroge", rides: 22, spend: 11660 },
      { passengerId: "p2", name: "Zawadi Otieno", rides: 18, spend: 9540 },
    ];
  }
  async getTopRoutes(): Promise<readonly TopRoute[]> {
    await delay();
    return [
      { pickup: "Nairobi CBD", dropoff: "Westlands", rides: 31, revenue: 16430 },
      { pickup: "Kilimani", dropoff: "JKIA", rides: 19, revenue: 22800 },
    ];
  }
}
