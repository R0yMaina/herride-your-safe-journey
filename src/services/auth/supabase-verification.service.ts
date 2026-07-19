import { supabase } from "@/integrations/supabase/client";
import type { IVerificationService } from "./verification.service";

export class SupabaseVerificationService implements IVerificationService {
  async sendEmailLink(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw new Error(error.message);
  }

  async confirmEmail(_token: string): Promise<void> {
    // Email confirmation happens via the link Supabase sends; the client
    // consumes the token from the URL automatically. Nothing to do here.
  }

  async sendPhoneOtp(phone: string): Promise<string> {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(error.message);
    // The phone doubles as the verification id — verifyOtp needs it back.
    return phone;
  }

  async confirmPhoneOtp(verificationId: string, code: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      phone: verificationId,
      token: code,
      type: "sms",
    });
    if (error) throw new Error(error.message);
  }
}
