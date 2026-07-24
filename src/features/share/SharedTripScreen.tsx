import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Container, GlassCard, ScreenWrapper } from "@/components/common";
import { HeRideMark } from "@/components/brand/HeRideMark";

interface SharedTrip {
  status: string;
  pickup_address: string | null;
  drop_address: string | null;
  has_driver: boolean;
  expires_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  requested: "Finding a driver",
  matched: "Matched with a driver",
  accepted: "Driver on the way",
  arrived: "Driver has arrived",
  in_progress: "On the trip",
  completed: "Trip completed",
  cancelled: "Trip cancelled",
};

export function SharedTripScreen({ token }: { token: string }) {
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_shared_trip", { _token: token });
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row) {
        setState("invalid");
      } else {
        setTrip(row as SharedTrip);
        setState("ok");
      }
    };
    void load();
    // Poll every 10s — this page is unauthenticated so it can't use realtime.
    const id = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [token]);

  return (
    <ScreenWrapper>
      <Container className="space-y-6 pt-8 text-center">
        <div className="flex justify-center">
          <HeRideMark size={72} />
        </div>

        {state === "loading" && <p className="text-sm text-muted-foreground">Loading trip…</p>}

        {state === "invalid" && (
          <GlassCard className="space-y-2 py-8">
            <p className="font-display text-lg text-foreground">Link expired</p>
            <p className="text-sm text-muted-foreground">
              This trip-share link is no longer active.
            </p>
          </GlassCard>
        )}

        {state === "ok" && trip && (
          <>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
                Live trip share
              </p>
              <h1 className="font-display text-2xl text-foreground">
                {STATUS_LABEL[trip.status] ?? trip.status}
              </h1>
            </div>
            <GlassCard className="space-y-2 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Route</p>
              <p className="text-sm text-foreground">{trip.pickup_address ?? "Pickup"}</p>
              <p className="text-sm text-foreground">→ {trip.drop_address ?? "Destination"}</p>
            </GlassCard>
            <GlassCard className="flex items-center gap-3 text-left">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                {trip.has_driver
                  ? "A verified female driver is assigned to this trip."
                  : "Matching with a verified female driver."}
              </p>
            </GlassCard>
            <p className="text-xs text-muted-foreground">Shared via HeRide · updates live</p>
          </>
        )}
      </Container>
    </ScreenWrapper>
  );
}
