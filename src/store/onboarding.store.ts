import { create } from "zustand";
import { storageService } from "@/services/storage/storage.service";
import { STORAGE_KEYS } from "@/services/storage/keys";

interface OnboardingState {
  readonly completed: boolean;
  hydrate: () => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,
  hydrate: () => {
    const done = storageService.get<boolean>(STORAGE_KEYS.onboardingComplete);
    set({ completed: Boolean(done) });
  },
  complete: () => {
    storageService.set(STORAGE_KEYS.onboardingComplete, true);
    set({ completed: true });
  },
  reset: () => {
    storageService.remove(STORAGE_KEYS.onboardingComplete);
    set({ completed: false });
  },
}));