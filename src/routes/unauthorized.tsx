import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedScreen } from "@/features/common/UnauthorizedScreen";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Access restricted · HeRide" }] }),
  component: UnauthorizedScreen,
});
