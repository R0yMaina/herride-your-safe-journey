import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useRideRequestStore } from "@/store/ride-request.store";
import { rideRequestService } from "@/services/ride";
import { promoService } from "@/services/promos";
import type { TripSummary } from "@/types/ride";
import { ROUTES } from "@/constants/routes";
import { StepHeader } from "../../components/StepHeader";
import { TripSummaryCard } from "../../components/TripSummaryCard";
import { EmergencyReminder } from "../../components/EmergencyReminder";
import { RouteMapPreview } from "../../components/RouteMapPreview";
import { BottomActionBar } from "../../components/BottomActionBar";
import { ConfirmButton } from "../../components/ConfirmButton";
import { PromoCodeCard } from "../../components/PromoCodeCard";

export function ConfirmStep() {
  const pickup = useRideRequestStore((s) => s.pickup);
  const destination = useRideRequestStore((s) => s.destination);
  const route = useRideRequestStore((s) => s.route);
  const option = useRideRequestStore((s) => s.option);
  const fare = useRideRequestStore((s) => s.fare);
  const preferences = useRideRequestStore((s) => s.preferences);
  const schedule = useRideRequestStore((s) => s.schedule);
  const note = useRideRequestStore((s) => s.note);
  const stops = useRideRequestStore((s) => s.stops);
  const promo = useRideRequestStore((s) => s.promo);
  const submitting = useRideRequestStore((s) => s.submitting);
  const setSubmitting = useRideRequestStore((s) => s.setSubmitting);
  const setDraft = useRideRequestStore((s) => s.setDraft);
  const setError = useRideRequestStore((s) => s.setError);

  const navigate = useNavigate();

  const ready = pickup && destination && route && option && fare;

  const handleConfirm = async () => {
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    try {
      const summary: TripSummary = {
        pickup,
        destination,
        stops,
        route,
        option,
        fare,
        preferences,
        schedule,
        note,
      };
      const draft = await rideRequestService.submit(summary);
      // Lock the validated promo onto the booked ride; settlement honours it.
      // Non-fatal: the ride is already requested if this fails.
      if (promo) {
        await promoService.applyToRide(draft.id, promo.code).catch((e: unknown) => {
          toast.error(e instanceof Error ? e.message : "Promo could not be applied");
        });
      }
      setDraft(draft);
      void navigate({ to: ROUTES.searching });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="space-y-5">
        <StepHeader title="Review your ride" />
        <p className="text-sm text-muted-foreground">
          Complete previous steps to review your trip.
        </p>
      </div>
    );
  }

  const summary: TripSummary = {
    pickup,
    destination,
    stops,
    route,
    option,
    fare,
    preferences,
    schedule,
    note,
  };

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StepHeader
        title="Review your ride"
        subtitle="Everything looks good? Confirm to find your driver."
      />
      <RouteMapPreview
        route={route}
        pickup={pickup?.coords ?? null}
        destination={destination?.coords ?? null}
        stops={stops.map((s) => s.coords)}
      />
      <TripSummaryCard summary={summary} />
      <PromoCodeCard />
      <EmergencyReminder />
      <BottomActionBar>
        <ConfirmButton loading={submitting} onClick={handleConfirm}>
          {submitting ? "Requesting…" : "Confirm ride"}
        </ConfirmButton>
      </BottomActionBar>
    </motion.div>
  );
}
