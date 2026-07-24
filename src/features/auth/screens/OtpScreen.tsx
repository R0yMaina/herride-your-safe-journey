import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRequestPhoneOtp, useVerifyPhoneOtp } from "../hooks/useAuthMutations";
import { usePhoneVerificationStore } from "../store/phone-verification.store";
import { ROUTES } from "@/constants/routes";

const RESEND_SECONDS = 30;

export function OtpScreen() {
  const navigate = useNavigate();
  const challenge = usePhoneVerificationStore((s) => s.challenge);
  const setChallenge = usePhoneVerificationStore((s) => s.setChallenge);
  const verify = useVerifyPhoneOtp();
  const resend = useRequestPhoneOtp();
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!challenge) void navigate({ to: ROUTES.phone, replace: true });
  }, [challenge, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const onVerify = async () => {
    if (!challenge) return;
    try {
      await verify.mutateAsync({ id: challenge.verificationId, code });
      toast.success("Phone verified");
      void navigate({ to: ROUTES.home, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    }
  };

  const onResend = async () => {
    if (!challenge) return;
    const next = await resend.mutateAsync(challenge.phone);
    setChallenge(next);
    setSecondsLeft(RESEND_SECONDS);
    toast.success("New code sent");
  };

  return (
    <AuthLayout
      eyebrow="Verify"
      title="Enter the 6-digit code"
      subtitle={challenge ? `Sent to ${challenge.phone}` : "Sending your code…"}
      backTo={ROUTES.phone}
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 border-border/60 bg-card/60" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <PrimaryButton onClick={onVerify} loading={verify.isPending} disabled={code.length < 6}>
          Verify
        </PrimaryButton>

        <div className="text-center text-xs text-muted-foreground">
          {secondsLeft > 0 ? (
            <>Resend code in {secondsLeft}s</>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="font-semibold text-primary"
              disabled={resend.isPending}
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
