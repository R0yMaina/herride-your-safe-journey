import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordScreen } from "@/features/auth/screens/ForgotPasswordScreen";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password · HeRide" }] }),
  component: ForgotPasswordScreen,
});