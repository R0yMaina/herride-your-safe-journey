import { createFileRoute } from "@tanstack/react-router";
import { DriverHomeScreen } from "@/features/driver/DriverHomeScreen";

export const Route = createFileRoute("/driver/")({
  head: () => ({
    meta: [
      { title: "Drive · HeRide" },
      { name: "description", content: "Go online and accept HeRide requests." },
    ],
  }),
  component: DriverHomeScreen,
});
