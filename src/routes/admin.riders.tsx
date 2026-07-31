import { createFileRoute } from "@tanstack/react-router";
import { AdminRidersScreen } from "@/features/admin/AdminRidersScreen";

export const Route = createFileRoute("/admin/riders")({
  head: () => ({
    meta: [
      { title: "Rider verification · Admin · HeRide" },
      { name: "description", content: "Review HeRide rider identity submissions." },
    ],
  }),
  component: AdminRidersScreen,
});
