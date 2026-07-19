import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/features/home/HomeScreen";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home · HeRide" },
      { name: "description", content: "Book a safe, premium ride with a verified female driver." },
    ],
  }),
  component: HomeScreen,
});
