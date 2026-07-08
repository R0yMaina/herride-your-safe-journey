import { createFileRoute } from "@tanstack/react-router";
import { LogoutScreen } from "@/features/auth/screens/LogoutScreen";

export const Route = createFileRoute("/auth/logout")({
  head: () => ({ meta: [{ title: "Sign out · HeRide" }] }),
  component: LogoutScreen,
});