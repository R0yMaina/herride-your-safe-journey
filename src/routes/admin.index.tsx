import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardScreen } from "@/features/admin/AdminDashboardScreen";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin · HeRide" },
      { name: "description", content: "HeRide platform overview for administrators." },
    ],
  }),
  component: AdminDashboardScreen,
});
