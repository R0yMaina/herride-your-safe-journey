import { NearestFirstRanking } from "./ranking.strategy";
import type { IRideRankingStrategy } from "./ranking.strategy";

export type { IRideRankingStrategy, RankedRide, RankingContext } from "./ranking.strategy";
export { NearestFirstRanking } from "./ranking.strategy";

/** The active strategy. Swap here (or select by config/experiment) when
 * richer matching (ratings, acceptance rate, surge, AI) lands. */
export const rideRankingStrategy: IRideRankingStrategy = new NearestFirstRanking();
