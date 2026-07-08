import { createFileRoute } from "@tanstack/react-router";
import { SessionExpiredScreen } from "@/features/auth/screens/SessionExpiredScreen";

export const Route = createFileRoute("/auth/session-expired")({
  head: () => ({ meta: [{ title: "Session expired · HeRide" }] }),
  component: SessionExpiredScreen,
});