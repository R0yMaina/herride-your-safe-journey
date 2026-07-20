import type { Place } from "@/types/ride";
import { SAVED_PICKUPS } from "@/features/ride-request/data/saved-places";

export interface NewSavedPlace {
  readonly label: string;
  readonly address: string;
  readonly coords: { readonly lat: number; readonly lng: number };
}

/** Per-user saved places for the booking wizard. */
export interface ISavedPlacesService {
  list(): Promise<readonly Place[]>;
  add(place: NewSavedPlace): Promise<Place>;
  remove(id: string): Promise<void>;
}

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export class MockSavedPlacesService implements ISavedPlacesService {
  private places: Place[] = [...SAVED_PICKUPS.filter((p) => p.id !== "p_current")];

  async list() {
    await delay();
    return [...this.places];
  }

  async add(place: NewSavedPlace) {
    await delay();
    const created: Place = {
      id: crypto.randomUUID(),
      label: place.label,
      address: place.address,
      coords: place.coords,
    };
    this.places.push(created);
    return created;
  }

  async remove(id: string) {
    await delay();
    this.places = this.places.filter((p) => p.id !== id);
  }
}
