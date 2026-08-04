import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/common";
import { ROUTES } from "@/constants/routes";
import { riderVerificationService, verificationBlocksBooking } from "@/services/rider-verification";
import { VERIFICATION_KEY } from "../VerifyIdentityScreen";

/**
 * Tells her about the verification requirement before the database does.
 *
 * `tg_rides_require_verified_rider` will refuse the booking outright once her
 * grace is used up, and an error toast at the moment she taps "Confirm" is a
 * miserable way to learn about a rule. Shows nothing at all when verification
 * is switched off, or when she is already verified.
 */
export function VerificationNotice() {
  const { data: state } = useQuery({
    queryKey: VERIFICATION_KEY,
    queryFn: () => riderVerificationService.getState(),
  });

  if (!state || !state.required || state.isVerified || state.status === "pending") return null;

  const blocked = verificationBlocksBooking(state);

  return (
    <Link to={ROUTES.verifyIdentity} className="block pb-4">
      <GlassCard className={`flex items-center gap-3 ${blocked ? "border-destructive/40" : ""}`}>
        <ShieldAlert
          className={`h-5 w-5 shrink-0 ${blocked ? "text-destructive" : "text-primary"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {blocked ? "Verify your identity to book" : "Verify your identity"}
          </p>
          <p className="text-xs text-muted-foreground">
            {blocked
              ? "One ID photo and a selfie. It takes a minute."
              : `${state.ridesRemaining} more ${
                  state.ridesRemaining === 1 ? "ride" : "rides"
                } before this is required.`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </GlassCard>
    </Link>
  );
}
