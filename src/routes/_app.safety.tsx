import { createFileRoute } from "@tanstack/react-router";
import { SafetyScreen } from "@/features/support/SafetyScreen";

export const Route = createFileRoute("/_app/safety")({
  head: () => ({
    meta: [
      { title: "Safety suite · HeRide" },
      {
        name: "description",
        content:
          "Verified women drivers, pickup PIN, live trip share, trusted contacts and SOS — what each one does.",
      },
    ],
  }),
  component: SafetyScreen,
});
