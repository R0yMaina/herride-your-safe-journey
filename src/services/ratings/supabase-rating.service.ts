import { supabase } from "@/integrations/supabase/client";
import type { IRatingService, RideRating, SubmitRatingInput } from "./rating.service";

interface RatingRow {
  readonly id: string;
  readonly ride_id: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly compliments: string[] | null;
  readonly tip_amount: number | null;
  readonly created_at: string;
}

function mapRow(row: RatingRow): RideRating {
  return {
    id: row.id,
    rideId: row.ride_id,
    stars: row.rating,
    comment: row.comment,
    compliments: row.compliments ?? [],
    tipAmount: Number(row.tip_amount ?? 0),
    createdAt: row.created_at,
  };
}

export class SupabaseRatingService implements IRatingService {
  async hasRated(rideId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("has_rated", { _ride_id: rideId });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  async submit(input: SubmitRatingInput): Promise<RideRating> {
    const { data, error } = await supabase.rpc("submit_rating", {
      _ride_id: input.rideId,
      _stars: input.stars,
      _comment: input.comment?.trim() || undefined,
      _compliments: [...(input.compliments ?? [])],
      _tip: input.tip && input.tip > 0 ? input.tip : 0,
    });
    if (error) throw new Error(error.message);
    return mapRow(data as unknown as RatingRow);
  }
}
