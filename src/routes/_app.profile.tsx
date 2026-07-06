import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/features/profile/ProfileScreen";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile · HeRide" },
      { name: "description", content: "Manage your HeRide account, safety, and preferences." },
    ],
  }),
  component: ProfileScreen,
});