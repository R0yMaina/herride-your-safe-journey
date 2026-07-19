import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { PasswordInput } from "../components/PasswordInput";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import { PrimaryButton } from "../components/PrimaryButton";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth.schemas";
import { COUNTRIES } from "../data/countries";
import { useSignUp } from "../hooks/useAuthMutations";
import { ROUTES } from "@/constants/routes";

export function SignUpScreen() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "KE",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
      acceptPrivacy: false as unknown as true,
    },
  });

  const password = watch("password");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp.mutateAsync(values);
      toast.success("Account created");
      void navigate({ to: ROUTES.verifyEmail, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  });

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Join HeRide"
      subtitle="A safer way to move — built for her."
      backTo={ROUTES.welcome}
      footer={
        <>
          Already have an account?{" "}
          <Link to={ROUTES.signIn} className="font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            autoComplete="given-name"
            leading={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <FormField
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          leading={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <FormField
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+254 700 000000"
          leading={<Phone className="h-4 w-4" />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Country
          </label>
          <select
            {...register("country")}
            className="w-full rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-foreground shadow-soft backdrop-blur-xl focus:border-primary/60 focus:outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-noir">
                {c.name} ({c.dialCode})
              </option>
            ))}
          </select>
          {errors.country?.message && (
            <p className="text-xs text-destructive">{errors.country.message}</p>
          )}
        </div>

        <PasswordInput
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

        <div className="space-y-2 pt-1 text-xs text-muted-foreground">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border/60 bg-card/60 text-primary focus:ring-primary/40"
              {...register("acceptTerms")}
            />
            <span>
              I accept the <span className="text-primary">Terms of Service</span>.
            </span>
          </label>
          {errors.acceptTerms?.message && (
            <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
          )}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border/60 bg-card/60 text-primary focus:ring-primary/40"
              {...register("acceptPrivacy")}
            />
            <span>
              I accept the <span className="text-primary">Privacy Policy</span>.
            </span>
          </label>
          {errors.acceptPrivacy?.message && (
            <p className="text-xs text-destructive">{errors.acceptPrivacy.message}</p>
          )}
        </div>

        <PrimaryButton type="submit" loading={signUp.isPending}>
          Create account
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
