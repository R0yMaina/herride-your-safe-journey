import { create } from "zustand";

interface UIState {
  readonly isSplashDone: boolean;
  readonly isGlobalLoading: boolean;
  readonly activeModal: string | null;
  setSplashDone: (value: boolean) => void;
  setGlobalLoading: (value: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSplashDone: false,
  isGlobalLoading: false,
  activeModal: null,
  setSplashDone: (isSplashDone) => set({ isSplashDone }),
  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}));
