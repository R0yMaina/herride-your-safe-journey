import { supabase } from "@/integrations/supabase/client";
import type {
  IAnalyticsService,
  ReportBucket,
  ReportRow,
  TopCustomer,
  TopDriver,
  TopRoute,
} from "./analytics.service";

const sinceIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export class SupabaseAnalyticsService implements IAnalyticsService {
  async getReport(bucket: ReportBucket, days = 30): Promise<readonly ReportRow[]> {
    const { data, error } = await supabase.rpc("financial_report", {
      _bucket: bucket,
      _since: sinceIso(days),
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      period: r.period,
      grossRevenue: Number(r.gross_revenue ?? 0),
      commissionRevenue: Number(r.commission_revenue ?? 0),
      driverEarnings: Number(r.driver_earnings ?? 0),
      rides: Number(r.rides ?? 0),
    }));
  }

  async getTopDrivers(days = 30, limit = 5): Promise<readonly TopDriver[]> {
    const { data, error } = await supabase.rpc("get_top_drivers", {
      _since: sinceIso(days),
      _limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      driverId: r.driver_id,
      name: r.name,
      rides: Number(r.rides ?? 0),
      earnings: Number(r.earnings ?? 0),
    }));
  }

  async getTopCustomers(days = 30, limit = 5): Promise<readonly TopCustomer[]> {
    const { data, error } = await supabase.rpc("get_top_customers", {
      _since: sinceIso(days),
      _limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      passengerId: r.passenger_id,
      name: r.name,
      rides: Number(r.rides ?? 0),
      spend: Number(r.spend ?? 0),
    }));
  }

  async getTopRoutes(days = 30, limit = 5): Promise<readonly TopRoute[]> {
    const { data, error } = await supabase.rpc("get_top_routes", {
      _since: sinceIso(days),
      _limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      pickup: r.pickup,
      dropoff: r.dropoff,
      rides: Number(r.rides ?? 0),
      revenue: Number(r.revenue ?? 0),
    }));
  }
}
