import { createFileRoute } from "@tanstack/react-router";
import { PhoneScreen } from "@/features/auth/screens/PhoneScreen";

export const Route = createFileRoute("/auth/phone")({
  head: () => ({ meta: [{ title: "Phone verification · HeRide" }] }),
  component: PhoneScreen,
});