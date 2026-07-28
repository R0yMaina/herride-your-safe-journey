import { supabase } from "@/integrations/supabase/client";
import type { DriverEarnings, IDriverEarningsService } from "./driver-earnings.service";

interface EarningsRow {
  readonly today: number;
  readonly week: number;
  readonly lifetime: number;
  readonly trips_today: number;
  readonly trips_week: number;
  readonly trips_lifetime: number;
  readonly tips_week: number;
  readonly commission_week: number;
  readonly currency: string;
}

const EMPTY: DriverEarnings = {
  today: 0,
  week: 0,
  lifetime: 0,
  tripsToday: 0,
  tripsWeek: 0,
  tripsLifetime: 0,
  tipsWeek: 0,
  commissionWeek: 0,
  currency: "KES",
};

export class SupabaseDriverEarningsService implements IDriverEarningsService {
  async getEarnings(): Promise<DriverEarnings> {
    const { data, error } = await supabase.rpc("driver_earnings");
    if (error) throw new Error(error.message);
    const row = (Array.isArray(data) ? data[0] : data) as EarningsRow | undefined;
    if (!row) return EMPTY;
    return {
      today: Number(row.today ?? 0),
      week: Number(row.week ?? 0),
      lifetime: Number(row.lifetime ?? 0),
      tripsToday: Number(row.trips_today ?? 0),
      tripsWeek: Number(row.trips_week ?? 0),
      tripsLifetime: Number(row.trips_lifetime ?? 0),
      tipsWeek: Number(row.tips_week ?? 0),
      commissionWeek: Number(row.commission_week ?? 0),
      currency: row.currency ?? "KES",
    };
  }
}
