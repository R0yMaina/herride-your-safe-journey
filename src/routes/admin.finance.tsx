import { createFileRoute } from "@tanstack/react-router";
import { AdminFinanceScreen } from "@/features/admin/AdminFinanceScreen";

export const Route = createFileRoute("/admin/finance")({
  head: () => ({
    meta: [
      { title: "Finance · Admin · HeRide" },
      { name: "description", content: "HeRide financial overview for administrators." },
    ],
  }),
  component: AdminFinanceScreen,
});
