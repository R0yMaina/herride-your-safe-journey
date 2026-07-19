import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { IconButton, PageHeader } from "@/components/common";
import { ROUTES } from "@/constants/routes";
import { RIDE_REQUEST_STEPS, useRideRequestStore } from "@/store/ride-request.store";

interface StepHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
}

export function StepHeader({ title, subtitle }: StepHeaderProps) {
  const step = useRideRequestStore((s) => s.step);
  const back = useRideRequestStore((s) => s.back);
  const navigate = useNavigate();
  const idx = RIDE_REQUEST_STEPS.indexOf(step);
  const total = RIDE_REQUEST_STEPS.length;

  const handleBack = () => {
    if (idx === 0) void navigate({ to: ROUTES.home });
    else back();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={`Step ${idx + 1} of ${total}`}
        title={title}
        subtitle={subtitle}
        action={
          <IconButton aria-label="Go back" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />
      <div className="flex gap-1.5" aria-hidden>
        {RIDE_REQUEST_STEPS.map((s, i) => (
          <span
            key={s}
            className={
              "h-1 flex-1 rounded-full transition-colors " +
              (i <= idx ? "bg-gradient-pink" : "bg-white/10")
            }
          />
        ))}
      </div>
    </div>
  );
}
