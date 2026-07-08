import { Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "../components/AuthLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { ROUTES } from "@/constants/routes";

export function SessionExpiredScreen() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Session expired" subtitle="For your safety, please sign in again.">
      <div className="space-y-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/15 text-primary">
          <Clock className="h-8 w-8" />
        </div>
        <PrimaryButton onClick={() => navigate({ to: ROUTES.signIn, replace: true })}>
          Sign in again
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}