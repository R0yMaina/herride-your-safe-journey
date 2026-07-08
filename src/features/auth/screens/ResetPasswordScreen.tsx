import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import { PrimaryButton } from "../components/PrimaryButton";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth.schemas";
import { useResetPassword } from "../hooks/useAuthMutations";
import { ROUTES } from "@/constants/routes";

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = handleSubmit(async ({ password: newPassword }) => {
    try {
      await reset.mutateAsync({ token: "mock-token", password: newPassword });
      void navigate({ to: ROUTES.passwordUpdated, replace: true });
    } catch {
      toast.error("Could not update password");
    }
  });

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Choose a new password"
      subtitle="Make it strong — mix cases, numbers, and symbols."
      backTo={ROUTES.forgotPassword}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordStrengthMeter value={password ?? ""} />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <PrimaryButton type="submit" loading={reset.isPending}>
          Update password
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}