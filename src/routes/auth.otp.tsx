import { createFileRoute } from "@tanstack/react-router";
import { OtpScreen } from "@/features/auth/screens/OtpScreen";

export const Route = createFileRoute("/auth/otp")({
  head: () => ({ meta: [{ title: "Verify code · HeRide" }] }),
  component: OtpScreen,
});