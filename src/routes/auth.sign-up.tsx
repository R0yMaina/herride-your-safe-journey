import { createFileRoute } from "@tanstack/react-router";
import { GuestRoute } from "@/components/guards/GuestRoute";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({ meta: [{ title: "Create account · HeRide" }] }),
  component: () => (
    <GuestRoute>
      <SignUpScreen />
    </GuestRoute>
  ),
});
