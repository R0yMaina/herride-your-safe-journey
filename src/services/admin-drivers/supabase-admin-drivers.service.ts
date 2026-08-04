import { supabase } from "@/integrations/supabase/client";
import type {
  PendingDriverCheck,
  DriverApplicationSummary,
  DriverVerificationStatus,
  IAdminDriversService,
} from "./admin-drivers.service";

interface ApplicationRow {
  readonly user_id: string;
  readonly full_name: string | null;
  readonly phone: string | null;
  readonly license_number: string;
  readonly national_id: string;
  readonly vehicle_make: string | null;
  readonly vehicle_model: string | null;
  readonly vehicle_plate: string | null;
  readonly vehicle_color: string | null;
  readonly vehicle_year: number | null;
  readonly selfie_url: string | null;
  readonly id_document_url: string | null;
  readonly verification_status: DriverVerificationStatus;
  readonly rejection_reason: string | null;
  readonly applied_at: string;
}

function mapRow(row: ApplicationRow): DriverApplicationSummary {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    licenseNumber: row.license_number,
    nationalId: row.national_id,
    vehicle: [row.vehicle_make, row.vehicle_model].filter(Boolean).join(" "),
    vehiclePlate: row.vehicle_plate,
    vehicleColor: row.vehicle_color,
    vehicleYear: row.vehicle_year,
    selfieUrl: row.selfie_url,
    idDocumentUrl: row.id_document_url,
    status: row.verification_status,
    rejectionReason: row.rejection_reason,
    appliedAt: row.applied_at,
  };
}

export class SupabaseAdminDriversService implements IAdminDriversService {
  async list(
    status: DriverVerificationStatus = "pending",
  ): Promise<readonly DriverApplicationSummary[]> {
    const { data, error } = await supabase.rpc("list_driver_applications", { _status: status });
    if (error) throw new Error(error.message);
    return ((data ?? []) as ApplicationRow[]).map(mapRow);
  }

  async setStatus(
    driverUserId: string,
    status: DriverVerificationStatus,
    reason?: string,
  ): Promise<void> {
    const { error } = await supabase.rpc("set_driver_status", {
      _driver_user_id: driverUserId,
      _status: status,
      _reason: reason,
    });
    if (error) throw new Error(error.message);
  }

  async listPendingChecks(): Promise<readonly PendingDriverCheck[]> {
    const { data, error } = await supabase.rpc("list_pending_driver_checks");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      driverUserId: row.driver_user_id,
      fullName: row.full_name,
      selfieUrl: row.selfie_url,
      verificationSelfieUrl: row.verification_selfie_url,
      submittedAt: row.submitted_at,
      lastCheckedAt: row.last_checked_at,
    }));
  }

  async reviewCheck(checkId: string, passed: boolean, reason?: string): Promise<void> {
    const { error } = await supabase.rpc("review_driver_check", {
      _check_id: checkId,
      _passed: passed,
      _reason: reason,
    });
    if (error) throw new Error(error.message);
  }

  async getDocumentUrl(path: string): Promise<string | null> {
    // Documents live in a private bucket — admins read them through a
    // short-lived signed URL, never a public link.
    const { data, error } = await supabase.storage.from("driver-docs").createSignedUrl(path, 300);
    if (error) return null;
    return data?.signedUrl ?? null;
  }
}
