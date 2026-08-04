import { supabase } from "@/integrations/supabase/client";
import type {
  IRiderVerificationService,
  PendingRiderVerification,
  RiderVerificationInput,
  RiderVerificationState,
  RiderVerificationStatus,
} from "./rider-verification.service";

const STATUSES: readonly RiderVerificationStatus[] = ["none", "pending", "verified", "rejected"];

function asStatus(value: string | null | undefined): RiderVerificationStatus {
  return STATUSES.includes(value as RiderVerificationStatus)
    ? (value as RiderVerificationStatus)
    : "none";
}

export class SupabaseRiderVerificationService implements IRiderVerificationService {
  async getState(): Promise<RiderVerificationState> {
    const { data, error } = await supabase.rpc("my_rider_verification");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      // No profile row yet (mid-signup). Treat as unverified but unblocked —
      // the DB trigger is the thing that actually stops a booking.
      return {
        isVerified: false,
        status: "none",
        rejectReason: null,
        submittedAt: null,
        required: false,
        ridesRemaining: 0,
      };
    }
    return {
      isVerified: Boolean(row.is_verified),
      status: asStatus(row.status),
      rejectReason: row.reject_reason,
      submittedAt: row.submitted_at,
      required: Boolean(row.required),
      ridesRemaining: Number(row.rides_remaining ?? 0),
    };
  }

  async uploadDocument(kind: "selfie" | "id", file: File): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(authError?.message ?? "Not signed in");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    // Folder is her user id — the bucket policy keys off exactly that.
    const path = `${user.id}/${kind}.${ext}`;
    const { error } = await supabase.storage
      .from("rider-docs")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) throw new Error(error.message);
    return path;
  }

  async submit(input: RiderVerificationInput): Promise<void> {
    const { error } = await supabase.rpc("submit_rider_verification", {
      _selfie_url: input.selfieUrl,
      _id_document_url: input.idDocumentUrl,
      _id_number: input.idNumber ?? undefined,
    });
    if (error) throw new Error(error.message);
  }

  async listPending(): Promise<readonly PendingRiderVerification[]> {
    const { data, error } = await supabase.rpc("list_pending_rider_verifications");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      phone: row.phone,
      gender: row.gender,
      selfieUrl: row.selfie_url,
      idDocumentUrl: row.id_document_url,
      idNumber: row.id_number,
      submittedAt: row.submitted_at,
    }));
  }

  async review(verificationId: string, approve: boolean, reason?: string): Promise<void> {
    const { error } = await supabase.rpc("review_rider_verification", {
      _verification_id: verificationId,
      _approve: approve,
      _reason: reason ?? undefined,
    });
    if (error) throw new Error(error.message);
  }

  async documentUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from("rider-docs").createSignedUrl(path, 300);
    if (error) return null;
    return data?.signedUrl ?? null;
  }
}
