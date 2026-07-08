import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth.schemas";
import { useForgotPassword } from "../hooks/useAuthMutations";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const forgot = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgot.mutateAsync(email);
      toast.success("Reset link sent");
      void navigate({ to: ROUTES.resetPassword });
    } catch {
      toast.error("Could not send reset link");
    }
  });

  return (
    <AuthLayout
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="We'll email you a secure link to reset it."
      backTo={ROUTES.signIn}
      footer={
        <Link to={ROUTES.signIn} className="font-semibold text-primary">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          leading={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <PrimaryButton type="submit" loading={forgot.isPending}>
          Send reset link
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}