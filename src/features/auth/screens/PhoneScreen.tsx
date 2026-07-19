import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import { phoneOnlySchema, type PhoneOnlyInput } from "@/lib/validation/auth.schemas";
import { useRequestPhoneOtp } from "../hooks/useAuthMutations";
import { usePhoneVerificationStore } from "../store/phone-verification.store";
import { ROUTES } from "@/constants/routes";

export function PhoneScreen() {
  const navigate = useNavigate();
  const request = useRequestPhoneOtp();
  const setChallenge = usePhoneVerificationStore((s) => s.setChallenge);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneOnlyInput>({
    resolver: zodResolver(phoneOnlySchema),
    defaultValues: { phone: "" },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    try {
      const challenge = await request.mutateAsync(phone);
      setChallenge(challenge);
      toast.success("Verification code sent");
      void navigate({ to: ROUTES.otp });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    }
  });

  return (
    <AuthLayout
      eyebrow="Phone verification"
      title="Enter your phone"
      subtitle="We'll send a 6-digit verification code by SMS."
      backTo={ROUTES.signIn}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField
          label="Phone number"
          type="tel"
          autoComplete="tel"
          placeholder="+254 700 000000"
          leading={<Phone className="h-4 w-4" />}
          error={errors.phone?.message}
          {...register("phone")}
        />
        <PrimaryButton type="submit" loading={request.isPending}>
          Send verification code
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
