import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/common";
import { Car } from "lucide-react";
import { useRideRequestStore } from "@/store/ride-request.store";
import { vehicleService } from "@/services/ride/vehicle.service";
import { fareService } from "@/services/ride/fare.service";
import type { FareEstimate, RideOption } from "@/types/ride";
import { VehicleSelector } from "../../components/VehicleSelector";
import { FareBreakdown } from "../../components/FareBreakdown";
import { BottomActionBar } from "../../components/BottomActionBar";
import { ConfirmButton } from "../../components/ConfirmButton";
import { StepHeader } from "../../components/StepHeader";
import { useFareEstimate } from "../../hooks/useFareEstimate";

export function VehicleStep() {
  const route = useRideRequestStore((s) => s.route);
  const option = useRideRequestStore((s) => s.option);
  const fare = useRideRequestStore((s) => s.fare);
  const setOption = useRideRequestStore((s) => s.setOption);
  const next = useRideRequestStore((s) => s.next);

  const [options, setOptions] = useState<readonly RideOption[]>([]);
  const [fareById, setFareById] = useState<Partial<Record<RideOption["id"], FareEstimate>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void vehicleService.list().then((list) => {
      if (cancelled) return;
      setOptions(list);
      setLoading(false);
      if (!option && list.length > 0) setOption(list[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [option, setOption]);

  useEffect(() => {
    if (!route || options.length === 0) return;
    let cancelled = false;
    void Promise.all(
      options.map(async (o) => [o.id, await fareService.estimate(route, o)] as const),
    ).then((entries) => {
      if (cancelled) return;
      setFareById(Object.fromEntries(entries) as Partial<Record<RideOption["id"], FareEstimate>>);
    });
    return () => {
      cancelled = true;
    };
  }, [route, options]);

  useFareEstimate();

  if (!route) {
    return (
      <div className="space-y-5">
        <StepHeader title="Choose your ride" />
        <EmptyState
          icon={<Car className="h-6 w-6" />}
          title="No route yet"
          description="Set a pickup and destination first."
        />
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StepHeader title="Choose your ride" subtitle="Compare ETAs, capacity, and fares." />
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : options.length === 0 ? (
        <EmptyState
          icon={<Car className="h-6 w-6" />}
          title="No vehicles available"
          description="Try again in a few minutes."
        />
      ) : (
        <VehicleSelector
          options={options}
          selectedId={option?.id ?? null}
          fareById={fareById}
          onSelect={setOption}
        />
      )}
      <FareBreakdown fare={fare} />
      <BottomActionBar>
        <ConfirmButton disabled={!option || !fare} onClick={next}>
          Continue with {option?.name ?? "ride"}
        </ConfirmButton>
      </BottomActionBar>
    </motion.div>
  );
}
