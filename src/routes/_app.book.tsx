import { createFileRoute } from "@tanstack/react-router";
import { BookRideScreen } from "@/features/ride-request/screens/BookRideScreen";

interface BookSearch {
  /** Open a picker straight away — set by the home screen's search field. */
  readonly focus?: "destination";
}

export const Route = createFileRoute("/_app/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch =>
    search.focus === "destination" ? { focus: "destination" } : {},
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
