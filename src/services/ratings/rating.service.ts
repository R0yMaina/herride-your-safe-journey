export interface RideRating {
  readonly id: string;
  readonly rideId: string;
  readonly stars: number;
  readonly comment: string | null;
  readonly compliments: readonly string[];
  readonly tipAmount: number;
  readonly createdAt: string;
}

export interface SubmitRatingInput {
  readonly rideId: string;
  readonly stars: number;
  readonly comment?: string;
  readonly compliments?: readonly string[];
  /** Passenger→driver tip in KES; wallet-funded, settled server-side. */
  readonly tip?: number;
}

export interface IRatingService {
  /** Whether the current user already rated this ride (drives sheet visibility). */
  hasRated(rideId: string): Promise<boolean>;
  /** Submit stars/compliments/comment (+ optional tip) for a completed ride. */
  submit(input: SubmitRatingInput): Promise<RideRating>;
}

/** Compliment chips offered post-trip — safety-first wording, HeRide voice. */
export const COMPLIMENT_OPTIONS: readonly { id: string; label: string }[] = [
  { id: "felt_safe", label: "Felt safe" },
  { id: "great_conversation", label: "Great conversation" },
  { id: "clean_car", label: "Clean car" },
  { id: "excellent_driving", label: "Excellent driving" },
  { id: "on_time", label: "On time" },
  { id: "above_beyond", label: "Above & beyond" },
];

/** Quick-tip amounts (KES) shown as one-tap buttons. */
export const TIP_PRESETS: readonly number[] = [50, 100, 200];

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export class MockRatingService implements IRatingService {
  private readonly rated = new Set<string>();

  async hasRated(rideId: string): Promise<boolean> {
    await delay(120);
    return this.rated.has(rideId);
  }

  async submit(input: SubmitRatingInput): Promise<RideRating> {
    await delay();
    if (input.stars < 1 || input.stars > 5) throw new Error("Rating must be 1–5 stars");
    if (this.rated.has(input.rideId)) throw new Error("You already rated this ride");
    this.rated.add(input.rideId);
    return {
      id: crypto.randomUUID(),
      rideId: input.rideId,
      stars: input.stars,
      comment: input.comment?.trim() || null,
      compliments: input.compliments ?? [],
      tipAmount: Math.max(input.tip ?? 0, 0),
      createdAt: new Date().toISOString(),
    };
  }
}
