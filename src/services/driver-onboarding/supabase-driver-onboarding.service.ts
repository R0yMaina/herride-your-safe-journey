import { supabase } from "@/integrations/supabase/client";
import type {
  DriverApplication,
  DriverApplicationInput,
  DriverCheckState,
  IDriverOnboardingService,
} from "./driver-onboarding.service";

interface DriverRow {
  readonly license_number: string;
  readonly national_id: string;
  readonly vehicle_make: string | null;
  readonly vehicle_model: string | null;
  readonly vehicle_plate: string | null;
  readonly vehicle_color: string | null;
  readonly vehicle_year: number | null;
  readonly selfie_url: string | null;
  readonly id_document_url: string | null;
  readonly verification_status: DriverApplication["status"];
  readonly rejection_reason: string | null;
  readonly created_at: string;
}

function mapRow(row: DriverRow): DriverApplication {
  return {
    status: row.verification_status,
    licenseNumber: row.license_number,
    nationalId: row.national_id,
    vehicleMake: row.vehicle_make ?? "",
    vehicleModel: row.vehicle_model ?? "",
    vehiclePlate: row.vehicle_plate ?? "",
    vehicleColor: row.vehicle_color,
    vehicleYear: row.vehicle_year,
    selfieUrl: row.selfie_url,
    idDocumentUrl: row.id_document_url,
    rejectionReason: row.rejection_reason,
    appliedAt: row.created_at,
  };
}

export class SupabaseDriverOnboardingService implements IDriverOnboardingService {
  async getMyApplication(): Promise<DriverApplication | null> {
    const { data, error } = await supabase.rpc("get_my_driver_application");
    if (error) throw new Error(error.message);
    // RPC returns a composite row of NULLs when there is no application.
    const row = data as unknown as DriverRow | null;
    if (!row || !row.license_number) return null;
    return mapRow(row);
  }

  async apply(input: DriverApplicationInput): Promise<DriverApplication> {
    const { data, error } = await supabase.rpc("apply_as_driver", {
      _license_number: input.licenseNumber,
      _national_id: input.nationalId,
      _vehicle_make: input.vehicleMake,
      _vehicle_model: input.vehicleModel,
      _vehicle_plate: input.vehiclePlate,
      _vehicle_color: input.vehicleColor,
      _vehicle_year: input.vehicleYear,
      _selfie_url: input.selfieUrl,
      _id_document_url: input.idDocumentUrl,
    });
    if (error) throw new Error(error.message);
    return mapRow(data as unknown as DriverRow);
  }

  async uploadDocument(kind: "selfie" | "id", file: File): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(authError?.message ?? "Not signed in");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${kind}.${ext}`;
    const { error } = await supabase.storage
      .from("driver-docs")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) throw new Error(error.message);
    return path;
  }

  async getCheckState(): Promise<DriverCheckState | null> {
    const { data, error } = await supabase.rpc("my_driver_check_state");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      isCurrent: Boolean(row.is_current),
      lastCheckedAt: row.last_checked_at,
      dueAt: row.due_at,
      pendingReview: Boolean(row.pending_review),
    };
  }

  async submitCheck(selfieUrl: string): Promise<void> {
    const { error } = await supabase.rpc("submit_driver_check", { _selfie_url: selfieUrl });
    if (error) throw new Error(error.message);
  }
}
