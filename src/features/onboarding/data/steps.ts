import { Bell, MapPin, ShieldCheck, Siren, Sparkles, UserCheck } from "lucide-react";
import type { ComponentType } from "react";

export interface OnboardingStep {
  readonly id: string;
  readonly Icon: ComponentType<{ className?: string }>;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "welcome",
    Icon: Sparkles,
    eyebrow: "Welcome",
    title: "Welcome to HeRide",
    description: "A premium ride experience built for her — safe, elegant, effortless.",
  },
  {
    id: "safety",
    Icon: ShieldCheck,
    eyebrow: "Safety first",
    title: "Safety in every ride",
    description: "Live trip share, audio guardian, and one-tap SOS come standard.",
  },
  {
    id: "drivers",
    Icon: UserCheck,
    eyebrow: "Trust",
    title: "Verified female drivers",
    description: "Every driver is background-checked and trained for her comfort.",
  },
  {
    id: "emergency",
    Icon: Siren,
    eyebrow: "Emergency",
    title: "Help in one tap",
    description: "Reach trusted contacts or emergency services instantly, anywhere.",
  },
  {
    id: "location",
    Icon: MapPin,
    eyebrow: "Location",
    title: "Enable location",
    description: "So we can match you with drivers nearby and share your live trip.",
  },
  {
    id: "notifications",
    Icon: Bell,
    eyebrow: "Notifications",
    title: "Stay in the loop",
    description: "Ride updates, driver arrivals, and safety alerts — never miss a beat.",
  },
];