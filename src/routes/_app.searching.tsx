import { createFileRoute } from "@tanstack/react-router";
import { SearchingDriverScreen } from "@/features/ride-request/screens/SearchingDriverScreen";

export const Route = createFileRoute("/_app/searching")({
  head: () => ({
    meta: [
      { title: "Finding your driver · HeRide" },
      { name: "description", content: "We're matching you with a verified female driver nearby." },
    ],
  }),
  component: SearchingDriverScreen,
});