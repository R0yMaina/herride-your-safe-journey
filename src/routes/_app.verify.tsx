import { createFileRoute } from "@tanstack/react-router";
import { VerifyIdentityScreen } from "@/features/verification/VerifyIdentityScreen";

export const Route = createFileRoute("/_app/verify")({
  head: () => ({
    meta: [
      { title: "Verify your identity · HeRide" },
      {
        name: "description",
        content:
          "Confirm who you are with an ID and a selfie, so every woman in the car knows who the other one is.",
      },
    ],
  }),
  component: VerifyIdentityScreen,
});
