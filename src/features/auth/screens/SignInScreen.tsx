import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { PasswordInput } from "../components/PasswordInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { signInSchema, type SignInInput } from "@/lib/validation/auth.schemas";
import { useSignIn } from "../hooks/useAuthMutations";
import { takeSignupIntent } from "../lib/signup-intent";
import { ROUTES } from "@/constants/routes";

export function SignInScreen() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
      toast.success("Welcome back");
      // Driver applicants (from the "Drive with HeRide" door) land on the
      // application form the first time they get in.
      const intent = takeSignupIntent();
      void navigate({
        to: intent === "driver" ? ROUTES.driverApply : ROUTES.home,
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    }
  });

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Enter your credentials to continue your safe ride experience."
      backTo={ROUTES.welcome}
      footer={
        <>
          New to HeRide?{" "}
          <Link to={ROUTES.signUp} className="font-semibold text-primary">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leading={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordInput
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-border/60 bg-card/60 text-primary focus:ring-primary/40"
            />
            Remember me
          </label>
          <Link to={ROUTES.forgotPassword} className="font-medium text-primary">
            Forgot password?
          </Link>
        </div>

        <PrimaryButton type="submit" loading={signIn.isPending}>
          Sign in
        </PrimaryButton>

        <Link to={ROUTES.phone}>
          <PrimaryButton variant="ghost">Continue with phone number</PrimaryButton>
        </Link>
      </form>
    </AuthLayout>
  );
}
