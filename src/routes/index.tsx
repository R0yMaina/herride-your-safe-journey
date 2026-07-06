import { createFileRoute } from "@tanstack/react-router";
import { SplashScreen } from "@/features/splash/SplashScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HeRide — The safest ride, for her." },
      { name: "description", content: "A premium, female-focused ride-hailing platform engineered for safety and trust." },
    ],
  }),
  component: SplashScreen,
});