import { createFileRoute } from "@tanstack/react-router";
import { PasswordUpdatedScreen } from "@/features/auth/screens/PasswordUpdatedScreen";

export const Route = createFileRoute("/auth/password-updated")({
  head: () => ({ meta: [{ title: "Password updated · HeRide" }] }),
  component: PasswordUpdatedScreen,
});