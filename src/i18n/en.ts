/**
 * English copy. This file is the schema: `sw.ts` is typed against it, so a key
 * added here without a Swahili counterpart fails the build rather than
 * silently showing English to a Swahili speaker.
 *
 * Keys are grouped by surface and named for what the string *is*, not what it
 * says, so rewording never means renaming.
 *
 * `{placeholders}` are substituted at render time; both languages must use the
 * same placeholder names.
 */
export const en = {
  nav: {
    home: "Home",
    rides: "Rides",
    wallet: "Wallet",
    profile: "Profile",
  },

  common: {
    loading: "Loading…",
    cancel: "Cancel",
    back: "Back",
    retry: "Try again",
    close: "Close",
    somethingWentWrong: "Something went wrong",
  },

  home: {
    greeting: "Where to today?",
    searchPlaceholder: "Search a destination",
    savedPlaces: "Saved places",
    home: "Home",
    work: "Work",
    driversNearby: "{count} drivers nearby",
    noDriversNearby: "No drivers nearby right now",
  },

  booking: {
    title: "Book a ride",
    pickup: "Pickup",
    destination: "Destination",
    stop: "Stop {number}",
    chooseRide: "Choose your ride",
    preferences: "Preferences",
    schedule: "Schedule",
    confirm: "Confirm",
    distance: "Distance",
    duration: "Duration",
    ride: "Ride",
    estimatedFare: "Estimated fare",
    now: "Now",
    minutesAway: "{count} min away",
    bookNow: "Book now",
    surgeTitle: "{multiplier} fares",
    surgeBody:
      "More riders than drivers nearby right now. This rate is locked in when you book, even if it climbs while you decide.",
    heavyTraffic:
      "Heavy traffic — about {minutes} min slower than usual. Your fare includes the extra time.",
  },

  trip: {
    findingDriver: "Finding your driver",
    onYourWay: "On your way",
    tripComplete: "Thanks for riding",
    cancelled: "Ride cancelled",
    route: "Route",
    pickupPin: "Your pickup PIN",
    pickupPinHelp:
      "Only give this code to your driver once you're safely in the right car — the trip can't start without it.",
    emergencySos: "Emergency SOS",
    shareTrip: "Share trip",
    cancelRide: "Cancel ride",
    backToHome: "Back to home",
    messageDriver: "Message driver",
    fareCharged: "Fare charged",
    status: {
      requested: "Finding driver",
      matched: "Matched",
      accepted: "Driver assigned",
      arrived: "Driver arrived",
      in_progress: "In progress",
      completed: "Completed",
      cancelled: "Cancelled",
    },
  },

  receipt: {
    title: "Receipt",
    share: "Share",
    baseFare: "Base fare",
    distance: "Distance",
    distanceWith: "Distance ({km} km)",
    time: "Time",
    timeWith: "Time ({minutes} min)",
    bookingFee: "Booking fee",
    busyPeriod: "Busy period ({multiplier})",
    promo: "Promo {code}",
    promoGeneric: "Promo discount",
    waiting: "Waiting ({minutes} min)",
    minimumFareAdjustment: "Minimum fare adjustment",
    fareAdjustment: "Fare adjustment",
    cancellationFee: "Cancellation fee",
    cancellationNote:
      "Charged because a driver was already on her way to you. It goes to her, not to HeRide.",
    totalCharged: "Total charged",
    tip: "Tip to your driver",
    unavailable: "Receipt unavailable",
    copied: "Receipt copied to clipboard",
  },

  rides: {
    eyebrow: "History",
    title: "Your rides",
    subtitle: "Every trip, tracked and receipted.",
    active: "Active",
    past: "Past",
    noActive: "No active rides",
    noActiveHelp: "Book a ride from Home to see it here.",
    noPast: "No past rides yet",
    noPastHelp: "Completed and cancelled trips appear here.",
    receipt: "Receipt",
  },

  wallet: {
    title: "Wallet",
    balance: "Balance",
    topUp: "Top up",
    transactions: "Transactions",
    noTransactions: "No transactions yet",
  },

  profile: {
    title: "Profile",
    account: "Account",
    preferences: "Preferences",
    rideHistory: "Ride history",
    rideHistorySub: "Your trips, receipts & ratings",
    becomeDriver: "Become a driver",
    becomeDriverSub: "Verified women only — earn on your terms",
    walletPayments: "Wallet & payments",
    walletPaymentsSub: "Balance, top-ups & payouts",
    identityVerification: "Identity verification",
    identityVerified: "Your identity is confirmed",
    identityPending: "Your documents are being reviewed",
    identityUnverified: "Confirm who you are with an ID and a selfie",
    safetySuite: "Safety suite",
    safetySuiteSub: "SOS, live trip share & trusted contacts",
    notifications: "Notifications",
    helpSupport: "Help & support",
    helpSupportSub: "FAQs, report an issue, contact us",
    privacy: "Privacy",
    privacySub: "What we collect, and your rights over it",
    signOut: "Sign out",
    signOutSub: "Log out of this device",
    language: "Language",
    languageSub: "English or Kiswahili",
  },

  verification: {
    title: "Verify your identity",
    subtitle: "So every woman in the car knows who the other one is.",
    verified: "You're verified",
    verifiedBody: "Thank you — your account is fully verified. Nothing else to do.",
    underReview: "Documents under review",
    underReviewBody:
      "A person is looking at your photos. This usually takes a few hours, and you can keep booking in the meantime.",
    selfieLabel: "A photo of you, right now",
    idLabel: "Your national ID or passport",
    idNumberLabel: "ID number (optional)",
    submit: "Submit for review",
    submitting: "Submitting…",
    ridesRemaining: "You can book {count} more rides before this is required.",
    ridesRemainingOne: "You can book 1 more ride before this is required.",
    required: "Verification is now needed before you can book again.",
    photoNote:
      "They are stored privately, seen only by the person who reviews them, and deleted when you delete your account. They are never shown to drivers or other riders.",
  },

  driver: {
    online: "You're online",
    offline: "You're offline",
    onlineSub: "Receiving ride requests nearby",
    offlineSub: "Go online to receive requests",
    activeTrip: "Active trip",
    arrived: "I've arrived",
    startTrip: "Start trip",
    completeTrip: "Complete trip",
    messageRider: "Message rider",
    toYourRider: "To your rider",
    toDestination: "To the destination",
    findingRoute: "Finding the route…",
    waitingForLocation: "Waiting for your location…",
    then: "Then: {instruction}",
  },
} as const;

/**
 * Same shape, but every leaf widened from its literal to `string`.
 *
 * `as const` above is what lets `Leaves<>` build the dotted key union, but it
 * also types each value as the exact English sentence — which would make every
 * Swahili line a type error. This keeps the keys exact and frees the values.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
