import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MapCanvas } from "@/components/MapCanvas";
import { ShieldCheck, BadgeCheck, Venus, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";

const MATCH_TIMEOUT_SECONDS = 45;

const searchSchema = z.object({ rideId: z.string().uuid().optional() });

export const Route = createFileRoute("/matching")({
  head: () => ({ meta: [{ title: "Matching — HeriRide" }, { name: "description", content: "Matching you with a verified female driver." }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Matching,
});

function Matching() {
  const { rideId } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("requested");
  const [secondsLeft, setSecondsLeft] = useState(MATCH_TIMEOUT_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    const check = (s: string, driverId: string | null) => {
      setStatus(s);
      if (driverId && (s === "accepted" || s === "matched" || s === "arrived" || s === "in_progress")) {
        navigate({ to: "/trip", search: { rideId } as never });
      }
    };

    supabase
      .from("rides")
      .select("status, driver_id")
      .eq("id", rideId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) check(data.status, data.driver_id);
      });

    const channel = supabase
      .channel(`ride:${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          const r = payload.new as { status: string; driver_id: string | null };
          check(r.status, r.driver_id);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rideId, navigate]);

  // Countdown + timeout — only while still searching
  useEffect(() => {
    if (!rideId || timedOut) return;
    if (status !== "requested") return;
    setSecondsLeft(MATCH_TIMEOUT_SECONDS);
    const startedAt = Date.now();
    const id = setInterval(() => {
      const left = MATCH_TIMEOUT_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      if (left <= 0) {
        clearInterval(id);
        setSecondsLeft(0);
        setTimedOut(true);
        // Cancel the unclaimed ride so it stops being offered
        supabase
          .from("rides")
          .update({ status: "cancelled" })
          .eq("id", rideId)
          .eq("status", "requested")
          .then(() => {});
      } else {
        setSecondsLeft(left);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [rideId, status, timedOut]);

  const retry = async () => {
    if (!rideId) return;
    setRetrying(true);
    try {
      // Get the original ride to clone
      const { data: old, error: e1 } = await supabase
        .from("rides")
        .select("passenger_id, pickup_lat, pickup_lng, pickup_address, drop_lat, drop_lng, drop_address, fare_estimate")
        .eq("id", rideId)
        .maybeSingle();
      if (e1 || !old) throw e1 ?? new Error("Original ride not found");
      const { data, error } = await supabase
        .from("rides")
        .insert({ ...old, status: "requested" })
        .select("id")
        .single();
      if (error) throw error;
      setTimedOut(false);
      setStatus("requested");
      navigate({ to: "/matching", search: { rideId: data.id } as never, replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Could not retry search");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="relative min-h-full flex flex-col">
        <div className="absolute inset-0">
          <MapCanvas />
          <div className="absolute inset-0 bg-noir/60" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {!timedOut && [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-primary"
                animate={{ scale: [0.6, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
              />
            ))}
            <div className="w-28 h-28 rounded-full bg-gradient-pink p-1 shadow-glow">
              <div className="w-full h-full rounded-full bg-noir flex items-center justify-center">
                {timedOut ? <Clock className="w-12 h-12 text-primary" /> : <Venus className="w-12 h-12 text-primary" />}
              </div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold mt-8 text-center">
            {timedOut ? "No drivers available" : "Finding your driver"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
            {!rideId
              ? "No active ride. Book one to start matching."
              : timedOut
                ? "We couldn't reach a verified female driver near you. Try again or head back home."
                : status === "requested"
                  ? `Pinging verified female drivers near you… ${secondsLeft}s`
                  : `Ride ${status.replace("_", " ")}`}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-8 w-full max-w-sm">
            {[
              { i: Venus, l: "Female" },
              { i: BadgeCheck, l: "Verified" },
              { i: ShieldCheck, l: "Vetted" },
            ].map(({ i: Icon, l }) => (
              <div key={l} className="bg-card/80 backdrop-blur border border-border rounded-2xl py-3 flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-medium">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-4">
          {rideId && timedOut ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={retry}
                disabled={retrying}
                className="py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-glow disabled:opacity-60"
              >
                {retrying ? "Retrying…" : "Retry search"}
              </button>
              <Link
                to="/home"
                className="py-3.5 rounded-full bg-card border border-border text-sm font-semibold text-center"
              >
                Back to home
              </Link>
            </div>
          ) : rideId ? (
            <Link
              to="/trip"
              search={{ rideId } as never}
              className="block w-full text-center py-3.5 rounded-full bg-card border border-border text-sm font-semibold"
            >
              View live trip →
            </Link>
          ) : (
            <Link to="/book" className="block w-full text-center py-3.5 rounded-full bg-card border border-border text-sm font-semibold">
              Book a ride →
            </Link>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}