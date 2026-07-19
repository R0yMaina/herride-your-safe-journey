import { createFileRoute } from "@tanstack/react-router";
import { RidesScreen } from "@/features/rides/RidesScreen";

export const Route = createFileRoute("/_app/rides")({
  head: () => ({
    meta: [
      { title: "Rides · HeRide" },
      { name: "description", content: "View your upcoming and past HeRide trips." },
    ],
  }),
  component: RidesScreen,
});
