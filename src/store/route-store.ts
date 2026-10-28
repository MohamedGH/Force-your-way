/**
 * Route & Waypoint State Manager Store
 * Functional state updates for multi-stop routing, traffic and fuel calculations
 */

import { create } from 'zustand';
import { LocationPoint, optimizeWaypointsOrder } from '../utils/optimizer';
import {
  VehicleConfig,
  VEHICLE_PRESETS,
  FuelCalculationResult,
  calculateTripFuelCost,
} from '../utils/fuel-calculator';
import { PRESET_ROUTES } from '../utils/route-data';
import { isOk } from '../utils/fp';

export interface RouteStoreState {
  // Waypoints
  waypoints: LocationPoint[];
  roundTrip: boolean;
  isOptimized: boolean;
  optimizationSavings: {
    savedKm: number;
    savedPercent: number;
    savedCost: number;
  } | null;

  // Vehicle & Fuel
  vehicle: VehicleConfig;

  // Traffic & Conditions
  trafficOverlayVisible: boolean;
  simulatedTrafficDelayFactor: number; // 1.0 (nominal) to 2.5 (severe bouchons)

  // Computed Route & Fuel Results
  distanceMeters: number;
  durationNoTrafficSec: number;
  durationWithTrafficSec: number;
  fuelResult: FuelCalculationResult | null;
  isCalculating: boolean;
  lastCalculatedAt: number | null;

  // Actions
  addWaypoint: (point: Omit<LocationPoint, 'id'>) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<LocationPoint>) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  setRoundTrip: (roundTrip: boolean) => void;
  optimizeWaypoints: () => void;
  resetToOriginalOrder: (originalPoints: LocationPoint[]) => void;
  loadPresetRoute: (presetId: string) => void;
  setVehicle: (updates: Partial<VehicleConfig>) => void;
  setVehiclePreset: (presetKey: string) => void;
  setTrafficOverlayVisible: (visible: boolean) => void;
  setSimulatedTrafficDelayFactor: (factor: number) => void;
  updateRouteCalculation: (data: {
    distanceMeters: number;
    durationNoTrafficSec: number;
    durationWithTrafficSec: number;
  }) => void;
}

// Initial state
const defaultPreset = PRESET_ROUTES[0];
const initialVehicle: VehicleConfig = { ...VEHICLE_PRESETS.citadine_essence };

export const useRouteStore = create<RouteStoreState>((set, get) => {
  // Pure helper to recompute fuel based on current state
  const recomputeFuel = (
    distanceMeters: number,
    durationNoTrafficSec: number,
    durationWithTrafficSec: number,
    vehicle: VehicleConfig
  ): FuelCalculationResult | null => {
    const distanceKm = distanceMeters / 1000;
    const calcResult = calculateTripFuelCost({
      distanceKm,
      durationNoTrafficSec,
      durationWithTrafficSec,
      vehicle,
    });
    return isOk(calcResult) ? calcResult.data : null;
  };

  return {
    waypoints: defaultPreset.waypoints,
    roundTrip: false,
    isOptimized: false,
    optimizationSavings: null,
    vehicle: initialVehicle,
    trafficOverlayVisible: true,
    simulatedTrafficDelayFactor: 1.35, // default to realistic 35% traffic delay
    distanceMeters: 62000, // 62 km default
    durationNoTrafficSec: 3600, // 60 min nominal
    durationWithTrafficSec: 4860, // 81 min with bouchons (+21 min)
    fuelResult: recomputeFuel(62000, 3600, 4860, initialVehicle),
    isCalculating: false,
    lastCalculatedAt: Date.now(),

    addWaypoint: (point) => {
      const id = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      set((state) => {
        const newWaypoints = [...state.waypoints, { ...point, id }];
        return {
          waypoints: newWaypoints,
          isOptimized: false,
        };
      });
    },

    removeWaypoint: (id) => {
      set((state) => {
        if (state.waypoints.length <= 2) return state; // keep at least 2 points
        const newWaypoints = state.waypoints.filter((w) => w.id !== id);
        return {
          waypoints: newWaypoints,
          isOptimized: false,
        };
      });
    },

    updateWaypoint: (id, updates) => {
      set((state) => ({
        waypoints: state.waypoints.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        isOptimized: false,
      }));
    },

    reorderWaypoints: (fromIndex, toIndex) => {
      set((state) => {
        if (
          fromIndex < 0 ||
          fromIndex >= state.waypoints.length ||
          toIndex < 0 ||
          toIndex >= state.waypoints.length
        ) {
          return state;
        }
        const updated = [...state.waypoints];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return {
          waypoints: updated,
          isOptimized: false,
        };
      });
    },

    setRoundTrip: (roundTrip) => {
      set({ roundTrip, isOptimized: false });
    },

    optimizeWaypoints: () => {
      const state = get();
      const result = optimizeWaypointsOrder(state.waypoints, {
        roundTrip: state.roundTrip,
        keepLastFixed: !state.roundTrip,
      });

      if (isOk(result)) {
        const { orderedWaypoints, savedDistanceKm, savedPercentage } = result.data;
        // Compute estimated fuel savings in €
        const baseConso = state.vehicle.baseConsumption;
        const price = state.vehicle.fuelPricePerUnit;
        const savedLiters = (savedDistanceKm / 100) * baseConso;
        const savedCost = Math.round(savedLiters * price * 100) / 100;

        set({
          waypoints: orderedWaypoints,
          isOptimized: true,
          optimizationSavings: {
            savedKm: savedDistanceKm,
            savedPercent: savedPercentage,
            savedCost,
          },
        });
      }
    },

    resetToOriginalOrder: (originalPoints) => {
      set({
        waypoints: originalPoints,
        isOptimized: false,
        optimizationSavings: null,
      });
    },

    loadPresetRoute: (presetId) => {
      const preset = PRESET_ROUTES.find((p) => p.id === presetId) || PRESET_ROUTES[0];
      set({
        waypoints: preset.waypoints,
        isOptimized: false,
        optimizationSavings: null,
      });
    },

    setVehicle: (updates) => {
      set((state) => {
        const updatedVehicle = { ...state.vehicle, ...updates };
        const updatedFuel = recomputeFuel(
          state.distanceMeters,
          state.durationNoTrafficSec,
          state.durationWithTrafficSec,
          updatedVehicle
        );
        return {
          vehicle: updatedVehicle,
          fuelResult: updatedFuel,
        };
      });
    },

    setVehiclePreset: (presetKey) => {
      const preset = VEHICLE_PRESETS[presetKey];
      if (preset) {
        get().setVehicle(preset);
      }
    },

    setTrafficOverlayVisible: (trafficOverlayVisible) => {
      set({ trafficOverlayVisible });
    },

    setSimulatedTrafficDelayFactor: (factor) => {
      set((state) => {
        const clampedFactor = Math.max(1.0, Math.min(3.0, factor));
        const newDurationWithTraffic = Math.round(state.durationNoTrafficSec * clampedFactor);
        const fuel = recomputeFuel(
          state.distanceMeters,
          state.durationNoTrafficSec,
          newDurationWithTraffic,
          state.vehicle
        );
        return {
          simulatedTrafficDelayFactor: clampedFactor,
          durationWithTrafficSec: newDurationWithTraffic,
          fuelResult: fuel,
        };
      });
    },

    updateRouteCalculation: ({ distanceMeters, durationNoTrafficSec, durationWithTrafficSec }) => {
      set((state) => {
        const fuel = recomputeFuel(
          distanceMeters,
          durationNoTrafficSec,
          durationWithTrafficSec,
          state.vehicle
        );
        return {
          distanceMeters,
          durationNoTrafficSec,
          durationWithTrafficSec,
          fuelResult: fuel,
          isCalculating: false,
          lastCalculatedAt: Date.now(),
        };
      });
    },
  };
});
