import { MailCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "@/hooks/useAuth";
import { verificationService } from "@/services/auth";
import { ROUTES } from "@/constants/routes";

export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const email = user?.email ?? "your email";

  const resend = async () => {
    try {
      await verificationService.sendEmailLink(email);
      toast.success("Verification link sent");
    } catch {
      toast.error("Could not send verification link");
    }
  };

  return (
    <AuthLayout
      eyebrow="Verify email"
      title="Check your inbox"
      subtitle={`We sent a verification link to ${email}. Open it to activate your account.`}
    >
      <div className="space-y-6">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/15 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <PrimaryButton onClick={resend}>Resend verification email</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => navigate({ to: ROUTES.home })}>
          Continue to app
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}
