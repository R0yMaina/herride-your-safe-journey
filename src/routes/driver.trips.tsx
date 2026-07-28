import { createFileRoute } from "@tanstack/react-router";
import { DriverTripsScreen } from "@/features/driver/DriverTripsScreen";

export const Route = createFileRoute("/driver/trips")({
  head: () => ({
    meta: [
      { title: "Trips · HeRide" },
      { name: "description", content: "Your completed HeRide trips." },
    ],
  }),
  component: DriverTripsScreen,
});
