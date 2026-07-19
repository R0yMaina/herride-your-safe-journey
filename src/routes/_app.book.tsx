import { createFileRoute } from "@tanstack/react-router";
import { BookRideScreen } from "@/features/ride-request/screens/BookRideScreen";

export const Route = createFileRoute("/_app/book")({
  head: () => ({
    meta: [
      { title: "Book a ride · HeRide" },
      {
        name: "description",
        content:
          "Configure your HeRide trip — pickup, destination, ride type, preferences, and fare.",
      },
    ],
  }),
  component: BookRideScreen,
});
