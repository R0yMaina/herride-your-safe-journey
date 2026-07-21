import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Car, Share2, ShieldAlert, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { useRide } from "./hooks/useRide";
import { StatusTimeline } from "./components/StatusTimeline";
import { driverService, type PublicDriver } from "@/services/driver";
import { rideRequestService } from "@/services/ride";
import { safetyService } from "@/services/safety";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/features/ride-request/lib/format";

export function TripScreen({ rideId }: { rideId: string }) {
  const { ride, loading, error } = useRide(rideId);
  const navigate = useNavigate();
  const [driver, setDriver] = useState<PublicDriver | null>(null);

  useEffect(() => {
    if (ride?.driverId) {
      void driverService.getPublicDriver(ride.driverId).then(setDriver);
    }
  }, [ride?.driverId]);

  const cancel = async () => {
    try {
      await rideRequestService.cancel(rideId);
      toast("Ride cancelled");
      void navigate({ to: ROUTES.home, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel");
    }
  };

  const raiseSos = async () => {
    try {
      await safetyService.raiseSos(rideId);
      toast.success("SOS raised — your emergency alert is active");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not raise SOS");
    }
  };

  const shareTrip = async () => {
    try {
      const link = await safetyService.shareTrip(rideId);
      const shared = await navigator.clipboard?.writeText(link.url).then(
        () => true,
        () => false,
      );
      toast.success(shared ? "Trip link copied to clipboard" : `Share link: ${link.url}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create share link");
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Container className="pt-10 text-center text-sm text-muted-foreground">
          Loading your trip…
        </Container>
      </ScreenWrapper>
    );
  }

  if (error || !ride) {
    return (
      <ScreenWrapper>
        <Container className="space-y-4 pt-10 text-center">
          <p className="text-sm text-muted-foreground">{error ?? "Trip not found."}</p>
          <button
            onClick={() => navigate({ to: ROUTES.home, replace: true })}
            className="text-sm font-semibold text-primary"
          >
            Back to home
          </button>
        </Container>
      </ScreenWrapper>
    );
  }

  const cancellable = ["requested", "matched", "accepted", "arrived"].includes(ride.status);
  const completed = ride.status === "completed";
  const cancelled = ride.status === "cancelled";

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow={completed ? "Trip complete" : cancelled ? "Cancelled" : "Your trip"}
          title={
            completed
              ? "Thanks for riding"
              : cancelled
                ? "Ride cancelled"
                : ride.status === "requested"
                  ? "Finding your driver"
                  : "On your way"
          }
        />

        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Route</p>
          <p className="text-sm text-foreground">{ride.pickup.address ?? "Pickup"}</p>
          <p className="text-sm text-foreground">→ {ride.destination.address ?? "Destination"}</p>
          <p className="pt-2 text-sm font-semibold text-primary">
            {formatCurrency(completed ? (ride.fareFinal ?? 0) : (ride.fareEstimate ?? 0))}
            {!completed && " (est.)"}
          </p>
        </GlassCard>

        {driver && (
          <GlassCard className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-pink text-noir">
              <Car className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base text-foreground">{driver.name}</p>
              <p className="text-xs text-muted-foreground">
                {driver.vehicle}
                {driver.plate ? ` · ${driver.plate}` : ""}
              </p>
            </div>
            <span className="flex items-center gap-1 text-sm text-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" /> {driver.rating.toFixed(1)}
            </span>
          </GlassCard>
        )}

        {!completed && !cancelled && (
          <Section title="Trip status">
            <GlassCard>
              <StatusTimeline status={ride.status} />
            </GlassCard>
          </Section>
        )}

        {completed && (
          <GlassCard className="space-y-1 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fare charged</p>
            <p className="font-display text-3xl text-foreground">
              {formatCurrency(ride.fareFinal ?? ride.fareEstimate ?? 0)}
            </p>
          </GlassCard>
        )}

        <div className="flex flex-col gap-2">
          {!completed && !cancelled && (
            <>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-destructive/15 py-3 text-sm font-semibold text-destructive"
                onClick={raiseSos}
              >
                <ShieldAlert className="h-4 w-4" /> Emergency SOS
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 py-3 text-sm text-foreground"
                onClick={shareTrip}
              >
                <Share2 className="h-4 w-4" /> Share trip
              </button>
            </>
          )}
          {cancellable && (
            <button
              type="button"
              onClick={cancel}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 py-3 text-sm text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" /> Cancel ride
            </button>
          )}
          {(completed || cancelled) && (
            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.home, replace: true })}
              className="rounded-2xl bg-gradient-pink py-3 text-sm font-semibold text-noir"
            >
              Back to home
            </button>
          )}
        </div>
      </Container>
    </ScreenWrapper>
  );
}
