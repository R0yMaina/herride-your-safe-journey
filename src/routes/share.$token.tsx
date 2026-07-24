import { createFileRoute, useParams } from "@tanstack/react-router";
import { SharedTripScreen } from "@/features/share/SharedTripScreen";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Live trip · HeRide" },
      { name: "description", content: "Follow a HeRide trip in real time." },
    ],
  }),
  component: ShareRoute,
});

function ShareRoute() {
  const { token } = useParams({ from: "/share/$token" });
  return <SharedTripScreen token={token} />;
}
