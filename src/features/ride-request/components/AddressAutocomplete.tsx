import { useEffect, useRef, useState } from "react";
import { MapPin, Circle } from "lucide-react";
import type { Place } from "@/types/ride";
import { loadGoogleMaps } from "@/services/maps/google-loader";

interface AddressAutocompleteProps {
  readonly label: string;
  readonly kind: "pickup" | "destination";
  readonly value: Place | null;
  readonly onSelect: (place: Place) => void;
}

/**
 * Google Places address search. Binds a classic Places Autocomplete to the
 * input; on selection it resolves a full Place (name + formatted address +
 * coordinates) and hands it back. Rendered only when the Google provider is
 * active — the saved-place list remains the fallback everywhere else.
 */
export function AddressAutocomplete({ label, kind, value, onSelect }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(value?.address ?? "");
  const Icon = kind === "pickup" ? Circle : MapPin;

  useEffect(() => {
    let ac: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;
    void (async () => {
      try {
        const g = await loadGoogleMaps();
        if (!inputRef.current) return;
        ac = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ["name", "formatted_address", "geometry"],
        });
        listener = ac.addListener("place_changed", () => {
          const p = ac?.getPlace();
          const loc = p?.geometry?.location;
          if (!p || !loc) return;
          const place: Place = {
            id: crypto.randomUUID(),
            label: p.name ?? p.formatted_address ?? "Selected location",
            address: p.formatted_address ?? p.name ?? "",
            coords: { lat: loc.lat(), lng: loc.lng() },
          };
          setText(place.address);
          onSelect(place);
        });
      } catch {
        /* No key / not enabled — the input still renders, just without suggestions. */
      }
    })();
    return () => {
      if (listener) listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-3 py-3 backdrop-blur-xl focus-within:border-primary/60">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Search ${kind === "pickup" ? "pickup" : "destination"} address`}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
