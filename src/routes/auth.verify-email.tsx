import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailScreen } from "@/features/auth/screens/VerifyEmailScreen";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({ meta: [{ title: "Verify email · HeRide" }] }),
  component: VerifyEmailScreen,
});
