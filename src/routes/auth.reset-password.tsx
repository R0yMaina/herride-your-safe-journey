import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordScreen } from "@/features/auth/screens/ResetPasswordScreen";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({ meta: [{ title: "Reset password · HeRide" }] }),
  component: ResetPasswordScreen,
});
