import { create } from "zustand";
import type { PhoneVerificationChallenge } from "@/types/auth";

interface PhoneVerificationState {
  readonly challenge: PhoneVerificationChallenge | null;
  setChallenge: (c: PhoneVerificationChallenge | null) => void;
  clear: () => void;
}

export const usePhoneVerificationStore = create<PhoneVerificationState>((set) => ({
  challenge: null,
  setChallenge: (challenge) => set({ challenge }),
  clear: () => set({ challenge: null }),
}));