import { createFileRoute } from "@tanstack/react-router";
import { GuestRoute } from "@/components/guards/GuestRoute";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({ meta: [{ title: "Sign in · HeRide" }] }),
  component: () => (
    <GuestRoute>
      <SignInScreen />
    </GuestRoute>
  ),
});
