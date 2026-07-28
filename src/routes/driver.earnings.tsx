import { createFileRoute } from "@tanstack/react-router";
import { DriverEarningsScreen } from "@/features/driver/DriverEarningsScreen";

export const Route = createFileRoute("/driver/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings · HeRide" },
      { name: "description", content: "Your HeRide earnings, tips and payouts." },
    ],
  }),
  component: DriverEarningsScreen,
});
