import { createFileRoute } from "@tanstack/react-router";
import { PrivacyScreen } from "@/features/support/PrivacyScreen";

export const Route = createFileRoute("/_app/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · HeRide" },
      {
        name: "description",
        content: "What HeRide collects, why, who sees it, how long we keep it, and your rights.",
      },
    ],
  }),
  component: PrivacyScreen,
});
