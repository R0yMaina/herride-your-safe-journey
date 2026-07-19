import { createFileRoute } from "@tanstack/react-router";
import { GuestRoute } from "@/components/guards/GuestRoute";
import { WelcomeScreen } from "@/features/auth/screens/WelcomeScreen";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome · HeRide" }] }),
  component: () => (
    <GuestRoute>
      <WelcomeScreen />
    </GuestRoute>
  ),
});
