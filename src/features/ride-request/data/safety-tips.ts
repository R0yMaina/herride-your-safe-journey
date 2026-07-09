export interface SafetyTip {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export const SAFETY_TIPS: readonly SafetyTip[] = [
  {
    id: "verify",
    title: "Verify your driver",
    body: "Match the car plate, driver name, and photo before entering the vehicle.",
  },
  {
    id: "share",
    title: "Share your trip",
    body: "Emergency contacts can follow your ride in real time once it begins.",
  },
  {
    id: "sos",
    title: "SOS is one tap away",
    body: "Hold the shield button on the trip screen to alert HeRide safety agents.",
  },
  {
    id: "seatbelt",
    title: "Buckle up",
    body: "Always wear your seatbelt — even on short trips across the city.",
  },
];