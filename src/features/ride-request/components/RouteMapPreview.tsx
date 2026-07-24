import { useMemo } from "react";
import type { RouteEstimate } from "@/types/ride";
import { cn } from "@/lib/utils";

interface RouteMapPreviewProps {
  readonly route: RouteEstimate | null;
  readonly className?: string;
}

/**
 * Stylised, dependency-free map preview. Draws the polyline into an SVG
 * viewport so we don't need an API key or heavy tile provider on the
 * booking flow. The real map plugs into this same slot later.
 */
export function RouteMapPreview({ route, className }: RouteMapPreviewProps) {
  const path = useMemo(() => {
    if (!route || route.polyline.length < 2) return null;
    const lats = route.polyline.map((p) => p.lat);
    const lngs = route.polyline.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const w = Math.max(0.0001, maxLng - minLng);
    const h = Math.max(0.0001, maxLat - minLat);
    const points = route.polyline.map((p) => {
      const x = ((p.lng - minLng) / w) * 100;
      const y = 100 - ((p.lat - minLat) / h) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return {
      d: `M ${points.join(" L ")}`,
      start: points[0],
      end: points[points.length - 1],
    };
  }, [route]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-noir shadow-soft",
        "aspect-[16/10]",
        className,
      )}
      role="img"
      aria-label={route ? "Route preview" : "Route preview placeholder"}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,oklch(0.28_0.03_340/0.7),transparent_60%),radial-gradient(circle_at_80%_90%,oklch(0.22_0.04_5/0.6),transparent_55%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(oklch(0.98_0.005_340/0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(0.98_0.005_340/0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      {path ? (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="route-line" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.94 0.04 10)" />
              <stop offset="100%" stopColor="oklch(0.72 0.20 5)" />
            </linearGradient>
          </defs>
          <path
            d={path.d}
            fill="none"
            stroke="url(#route-line)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={path.start.split(",")[0]}
            cy={path.start.split(",")[1]}
            r="1.6"
            fill="oklch(0.94 0.04 10)"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={path.end.split(",")[0]}
            cy={path.end.split(",")[1]}
            r="1.6"
            fill="oklch(0.72 0.20 5)"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Pick a pickup and destination
        </div>
      )}
    </div>
  );
}
