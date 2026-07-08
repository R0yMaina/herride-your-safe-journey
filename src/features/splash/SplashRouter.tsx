import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SplashScreen } from "./SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStore } from "@/store/onboarding.store";
import { ROUTES } from "@/constants/routes";
import { appConfig } from "@/config/app.config";

/**
 * Shows the branded splash for the minimum duration, hydrates auth +
 * onboarding state, then routes to the correct entry surface.
 */
export function SplashRouter() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);

  useEffect(() => {
    hydrateOnboarding();
  }, [hydrateOnboarding]);

  useEffect(() => {
    if (status === "loading") return;
    const id = setTimeout(() => {
      if (!onboardingCompleted) {
        void navigate({ to: ROUTES.onboarding, replace: true });
        return;
      }
      if (status === "authenticated") {
        void navigate({ to: ROUTES.home, replace: true });
      } else {
        void navigate({ to: ROUTES.welcome, replace: true });
      }
    }, appConfig.splash.minDurationMs);
    return () => clearTimeout(id);
  }, [navigate, status, onboardingCompleted]);

  return <SplashScreen />;
}