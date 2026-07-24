import { createFileRoute, useParams } from "@tanstack/react-router";
import { TripScreen } from "@/features/trip/TripScreen";

export const Route = createFileRoute("/_app/trip/$rideId")({
  head: () => ({
    meta: [
      { title: "Your trip · HeRide" },
      { name: "description", content: "Track your HeRide trip in real time." },
    ],
  }),
  component: TripRoute,
});

function TripRoute() {
  const { rideId } = useParams({ from: "/_app/trip/$rideId" });
  return <TripScreen rideId={rideId} />;
}
