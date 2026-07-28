import { createFileRoute } from "@tanstack/react-router";
import { DriverProfileScreen } from "@/features/driver/DriverProfileScreen";

export const Route = createFileRoute("/driver/profile")({
  head: () => ({
    meta: [
      { title: "Driver profile · HeRide" },
      { name: "description", content: "Your driver profile, vehicle and verification." },
    ],
  }),
  component: DriverProfileScreen,
});
