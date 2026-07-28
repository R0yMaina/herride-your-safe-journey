import { supabase } from "@/integrations/supabase/client";
import {
  EMPTY_OVERVIEW,
  type AdminOverview,
  type IAdminOverviewService,
} from "./admin-overview.service";

interface OverviewRow {
  readonly pending_drivers: number;
  readonly verified_drivers: number;
  readonly suspended_drivers: number;
  readonly drivers_online: number;
  readonly active_rides: number;
  readonly rides_today: number;
  readonly completed_today: number;
  readonly cancelled_today: number;
  readonly gross_today: number;
  readonly commission_today: number;
  readonly open_sos: number;
  readonly open_fraud_signals: number;
  readonly passengers_total: number;
  readonly currency: string;
}

export class SupabaseAdminOverviewService implements IAdminOverviewService {
  async getOverview(): Promise<AdminOverview> {
    const { data, error } = await supabase.rpc("admin_overview");
    if (error) throw new Error(error.message);
    const row = (Array.isArray(data) ? data[0] : data) as OverviewRow | undefined;
    // Non-admins get no row back (the RPC filters on has_role) — show zeros
    // rather than throwing; the route guard already blocks them.
    if (!row) return EMPTY_OVERVIEW;
    return {
      pendingDrivers: Number(row.pending_drivers ?? 0),
      verifiedDrivers: Number(row.verified_drivers ?? 0),
      suspendedDrivers: Number(row.suspended_drivers ?? 0),
      driversOnline: Number(row.drivers_online ?? 0),
      activeRides: Number(row.active_rides ?? 0),
      ridesToday: Number(row.rides_today ?? 0),
      completedToday: Number(row.completed_today ?? 0),
      cancelledToday: Number(row.cancelled_today ?? 0),
      grossToday: Number(row.gross_today ?? 0),
      commissionToday: Number(row.commission_today ?? 0),
      openSos: Number(row.open_sos ?? 0),
      openFraudSignals: Number(row.open_fraud_signals ?? 0),
      passengersTotal: Number(row.passengers_total ?? 0),
      currency: row.currency ?? "KES",
    };
  }
}
