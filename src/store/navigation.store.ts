import { create } from "zustand";
import { ROUTES, type AppRoute } from "@/constants/routes";

interface NavigationState {
  readonly activeTab: AppRoute;
  setActiveTab: (tab: AppRoute) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: ROUTES.home,
  setActiveTab: (activeTab) => set({ activeTab }),
}));
