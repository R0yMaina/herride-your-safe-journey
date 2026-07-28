import { create } from "zustand";
import type {
  FareEstimate,
  Place,
  RideOption,
  RideRequestDraft,
  RideRequestStep,
  RidePreferenceId,
  RouteEstimate,
  ScheduleMode,
  ScheduledRide,
} from "@/types/ride";
import { RIDE_PREFERENCES } from "@/features/ride-request/data/preferences";
import type { PromoPreview } from "@/services/promos";

const NOTE_MAX = 240;
export const MAX_STOPS = 2;
const DEFAULT_PREFS: readonly RidePreferenceId[] = RIDE_PREFERENCES.filter(
  (p) => p.available && p.defaultOn,
).map((p) => p.id);

const STEP_ORDER: readonly RideRequestStep[] = [
  "location",
  "vehicle",
  "preferences",
  "schedule",
  "confirm",
];

interface RideRequestState {
  readonly step: RideRequestStep;
  readonly pickup: Place | null;
  readonly destination: Place | null;
  /** Intermediate stops (max 2, Uber-style). */
  readonly stops: readonly Place[];
  readonly route: RouteEstimate | null;
  readonly option: RideOption | null;
  readonly fare: FareEstimate | null;
  readonly preferences: readonly RidePreferenceId[];
  readonly schedule: ScheduledRide;
  readonly note: string;
  readonly noteMax: number;
  /** Server-validated promo preview, locked onto the ride at submit. */
  readonly promo: PromoPreview | null;
  readonly submitting: boolean;
  readonly draft: RideRequestDraft | null;
  readonly error: string | null;

  setStep: (step: RideRequestStep) => void;
  next: () => void;
  back: () => void;
  setPickup: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  addStop: (place: Place) => void;
  setStop: (index: number, place: Place) => void;
  removeStop: (index: number) => void;
  setRoute: (route: RouteEstimate | null) => void;
  setOption: (option: RideOption | null) => void;
  setFare: (fare: FareEstimate | null) => void;
  togglePreference: (id: RidePreferenceId) => void;
  setScheduleMode: (mode: ScheduleMode) => void;
  setScheduledFor: (iso: string | null) => void;
  setNote: (text: string) => void;
  setPromo: (promo: PromoPreview | null) => void;
  setSubmitting: (v: boolean) => void;
  setDraft: (d: RideRequestDraft | null) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

const initial = {
  step: "location" as RideRequestStep,
  pickup: null,
  destination: null,
  stops: [] as readonly Place[],
  route: null,
  option: null,
  fare: null,
  preferences: DEFAULT_PREFS,
  schedule: { mode: "now" as ScheduleMode, scheduledFor: null },
  note: "",
  noteMax: NOTE_MAX,
  promo: null,
  submitting: false,
  draft: null,
  error: null,
};

export const useRideRequestStore = create<RideRequestState>((set, get) => ({
  ...initial,
  setStep: (step) => set({ step }),
  next: () => {
    const i = STEP_ORDER.indexOf(get().step);
    if (i < STEP_ORDER.length - 1) set({ step: STEP_ORDER[i + 1] });
  },
  back: () => {
    const i = STEP_ORDER.indexOf(get().step);
    if (i > 0) set({ step: STEP_ORDER[i - 1] });
  },
  setPickup: (pickup) => set({ pickup, route: null, fare: null }),
  setDestination: (destination) => set({ destination, route: null, fare: null }),
  addStop: (place) =>
    set((s) =>
      s.stops.length >= MAX_STOPS ? s : { stops: [...s.stops, place], route: null, fare: null },
    ),
  setStop: (index, place) =>
    set((s) => ({
      stops: s.stops.map((p, i) => (i === index ? place : p)),
      route: null,
      fare: null,
    })),
  removeStop: (index) =>
    set((s) => ({ stops: s.stops.filter((_, i) => i !== index), route: null, fare: null })),
  setRoute: (route) => set({ route }),
  setOption: (option) => set({ option, fare: null }),
  setFare: (fare) => set({ fare }),
  togglePreference: (id) =>
    set((s) => ({
      preferences: s.preferences.includes(id)
        ? s.preferences.filter((p) => p !== id)
        : [...s.preferences, id],
    })),
  setScheduleMode: (mode) =>
    set((s) => ({
      schedule: { mode, scheduledFor: mode === "now" ? null : s.schedule.scheduledFor },
    })),
  setScheduledFor: (iso) => set((s) => ({ schedule: { ...s.schedule, scheduledFor: iso } })),
  setNote: (text) => set({ note: text.slice(0, NOTE_MAX) }),
  setPromo: (promo) => set({ promo }),
  setSubmitting: (submitting) => set({ submitting }),
  setDraft: (draft) => set({ draft }),
  setError: (error) => set({ error }),
  reset: () => set({ ...initial }),
}));

export const RIDE_REQUEST_STEPS = STEP_ORDER;
