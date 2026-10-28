/**
 * Route & View Navigation Manager Store
 * Manages active application screen, mobile panels, and view state
 */

import { create } from 'zustand';

export type AppView = 'planner' | 'nearest-mosque' | 'traffic' | 'fuel-cost' | 'matrix' | 'presets';

interface NavigationState {
  currentView: AppView;
  isMobileDrawerOpen: boolean;
  setCurrentView: (view: AppView) => void;
  toggleMobileDrawer: (open?: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'planner',
  isMobileDrawerOpen: false,

  setCurrentView: (view: AppView) => {
    set({ currentView: view });
    // Update hash for deep linkability
    window.location.hash = view;
  },

  toggleMobileDrawer: (open) =>
    set((state) => ({
      isMobileDrawerOpen: typeof open === 'boolean' ? open : !state.isMobileDrawerOpen,
    })),
}));
