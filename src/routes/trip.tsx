import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MapCanvas } from "@/components/MapCanvas";
import { AppHeader } from "@/components/AppHeader";
import { MessageCircle, Share2, ShieldAlert, Phone, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const searchSchema = z.object({ rideId: z.string().uuid().optional() });

type RideRow = {
  id: string;
  status: string;
  driver_id: string | null;
  pickup_address: string | null;
  drop_address: string | null;
  fare_estimate: number | null;
};

type DriverInfo = {
  full_name: string | null;
  avatar_url: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  rating: number | null;
};

export const Route = createFileRoute("/trip")({
  head: () => ({ meta: [{ title: "Live trip — HeriRide" }, { name: "description", content: "Track your ride in real time." }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Trip,
});

function Trip() {
  const { rideId } = Route.useSearch();
  const [ride, setRide] = useState<RideRow | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    const loadRide = async () => {
      const { data } = await supabase
        .from("rides")
        .select("id, status, driver_id, pickup_address, drop_address, fare_estimate")
        .eq("id", rideId)
        .maybeSingle();
      if (cancelled || !data) return;
      setRide(data as RideRow);
      if (data.driver_id) loadDriver(data.driver_id);
    };

    const loadDriver = async (driverId: string) => {
      const [{ data: prof }, { data: drv }, { data: loc }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", driverId).maybeSingle(),
        supabase
          .from("drivers")
          .select("vehicle_make, vehicle_model, vehicle_plate, rating")
          .eq("user_id", driverId)
          .maybeSingle(),
        supabase
          .from("driver_locations")
          .select("lat, lng")
          .eq("driver_user_id", driverId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setDriver({
        full_name: prof?.full_name ?? null,
        avatar_url: prof?.avatar_url ?? null,
        vehicle_make: drv?.vehicle_make ?? null,
        vehicle_model: drv?.vehicle_model ?? null,
        vehicle_plate: drv?.vehicle_plate ?? null,
        rating: drv?.rating ?? null,
      });
      if (loc) setDriverLoc({ lat: loc.lat, lng: loc.lng });
    };

    loadRide();

    const rideChan = supabase
      .channel(`trip-ride:${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          const r = payload.new as RideRow;
          setRide(r);
          if (r.driver_id && !driver) loadDriver(r.driver_id);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(rideChan);
    };
  }, [rideId]);

  // Subscribe to driver location updates once we know the driver
  useEffect(() => {
    const driverId = ride?.driver_id;
    if (!driverId) return;
    const chan = supabase
      .channel(`driver-loc:${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `driver_user_id=eq.${driverId}`,
        },
        (payload) => {
          const r = payload.new as { lat: number; lng: number };
          if (r?.lat != null) setDriverLoc({ lat: r.lat, lng: r.lng });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(chan);
    };
  }, [ride?.driver_id]);

  const statusLabel = ride
    ? ride.status === "accepted"
      ? "Driver on the way"
      : ride.status === "arrived"
        ? "Driver has arrived"
        : ride.status === "in_progress"
          ? "On trip"
          : ride.status === "completed"
            ? "Completed"
            : "Searching"
    : "No active trip";

  const driverInitial = driver?.full_name?.[0]?.toUpperCase() ?? "•";

  return (
    <PhoneFrame>
      <div className="relative min-h-full">
        <div className="absolute inset-0">
          <MapCanvas showRoute />
        </div>
        <div className="relative z-10">
          <AppHeader back="/home" sos />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {ride?.pickup_address ?? "—"} → {ride?.drop_address ?? "—"}
              </span>
              <span className="text-xs text-primary font-semibold">{statusLabel}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="font-display text-4xl font-semibold">
                {driverLoc ? "•" : "—"}
                <span className="text-base font-normal text-muted-foreground ml-2">
                  {driverLoc ? "live" : "waiting"}
                </span>
              </div>
              <div className="text-right text-xs">
                <div className="text-muted-foreground">Fare</div>
                <div className="font-semibold">
                  {ride?.fare_estimate ? `Ksh ${Number(ride.fare_estimate).toLocaleString()}` : "—"}
                </div>
              </div>
            </div>

            <div className="my-4 h-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-pink p-0.5">
                <div className="w-full h-full rounded-full bg-noir flex items-center justify-center font-display text-xl text-primary">
                  {driverInitial}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{driver?.full_name ?? "Awaiting driver"}</span>
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span className="text-xs">{driver?.rating ? Number(driver.rating).toFixed(2) : "—"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {driver
                    ? `${driver.vehicle_make ?? ""} ${driver.vehicle_model ?? ""}${driver.vehicle_plate ? ` · ${driver.vehicle_plate}` : ""}`.trim() || "Vehicle details pending"
                    : "Matching with a verified female driver…"}
                </div>
              </div>
              <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><MessageCircle className="w-4 h-4" /></button>
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><Phone className="w-4 h-4 text-primary-foreground" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link
                to="/share-trip"
                search={rideId ? ({ rideId } as never) : undefined}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary border border-border text-sm font-semibold"
              >
                <Share2 className="w-4 h-4 text-primary" /> Share trip
              </Link>
              <Link
                to="/sos"
                search={rideId ? ({ rideId } as never) : undefined}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-sm font-semibold"
              >
                <ShieldAlert className="w-4 h-4" /> SOS
              </Link>
            </div>

            <Link to="/ratings" className="block text-center mt-3 text-xs text-primary font-semibold">
              Trip ended? Rate your driver →
            </Link>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}