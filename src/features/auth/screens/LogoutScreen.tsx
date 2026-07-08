import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { useSignOut } from "../hooks/useAuthMutations";
import { ROUTES } from "@/constants/routes";

export function LogoutScreen() {
  const navigate = useNavigate();
  const signOut = useSignOut();

  const confirm = async () => {
    await signOut.mutateAsync();
    toast.success("You've been signed out");
    void navigate({ to: ROUTES.welcome, replace: true });
  };

  return (
    <AuthLayout title="Sign out?" subtitle="You'll need to sign in again to book rides.">
      <div className="space-y-5 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-destructive/15 text-destructive">
          <LogOut className="h-8 w-8" />
        </div>
        <PrimaryButton onClick={confirm} loading={signOut.isPending}>
          Yes, sign me out
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => navigate({ to: ROUTES.home })}>
          Cancel
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}