import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Container, ScreenWrapper } from "@/components/common";
import { useRideRequestStore } from "@/store/ride-request.store";
import { rideRequestService } from "@/services/ride/ride-request.service";
import { ROUTES } from "@/constants/routes";
import { SearchingAnimation } from "../components/SearchingAnimation";
import { SafetyTipsCarousel } from "../components/SafetyTipsCarousel";
import { formatDuration } from "../lib/format";

export function SearchingDriverScreen() {
  const draft = useRideRequestStore((s) => s.draft);
  const reset = useRideRequestStore((s) => s.reset);
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!draft) {
      void navigate({ to: ROUTES.book, replace: true });
    }
  }, [draft, navigate]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCancel = async () => {
    if (draft) await rideRequestService.cancel(draft.id);
    toast("Ride request cancelled");
    reset();
    void navigate({ to: ROUTES.home, replace: true });
  };

  const etaMin = draft?.summary.option.etaMin ?? 5;

  return (
    <ScreenWrapper className="pb-40">
      <Container className="flex flex-col items-center gap-8 pt-6 text-center">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
            Finding your driver
          </p>
          <h1 className="font-display text-3xl text-foreground">
            Matching you with a verified driver
          </h1>
          <p className="text-sm text-muted-foreground">
            Typical wait time · {formatDuration(etaMin)}
          </p>
        </div>

        <SearchingAnimation />

        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Searching · {formatDuration(Math.max(1, Math.floor(seconds / 60)))} {seconds % 60}s
        </p>

        <div className="w-full space-y-4">
          <SafetyTipsCarousel />
          <button
            type="button"
            onClick={handleCancel}
            className="mx-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-5 py-2.5 text-sm text-muted-foreground backdrop-blur-xl transition-colors hover:text-destructive"
          >
            <X className="h-4 w-4" /> Cancel ride request
          </button>
        </div>
      </Container>
    </ScreenWrapper>
  );
}
