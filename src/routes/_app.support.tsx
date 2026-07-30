import { createFileRoute } from "@tanstack/react-router";
import { SupportScreen } from "@/features/support/SupportScreen";

export const Route = createFileRoute("/_app/support")({
  head: () => ({
    meta: [
      { title: "Help & support · HeRide" },
      {
        name: "description",
        content:
          "Answers about safety, fares, wallet and driving with HeRide — and how to reach us.",
      },
    ],
  }),
  component: SupportScreen,
});
