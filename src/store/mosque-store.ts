/**
 * Nearest Mosque State Manager Store
 * Handles searching, geolocation, ranking by distance/time, and routing integration.
 */

import { create } from 'zustand';
import {
  MosqueCandidate,
  MosqueRankedItem,
  SortCriteria,
  evaluatePlaceMetrics,
  sortRankedPlaces,
  filterPlacesByRadius,
  KNOWN_MOSQUES_DATABASE,
} from '../utils/nearest-search';
import { useRouteStore } from './route-store';

interface MosqueStoreState {
  searchOriginName: string;
  originCoords: { lat: number; lng: number };
  sortCriteria: SortCriteria;
  maxRadiusKm: number;
  searchQuery: string;
  isLoading: boolean;
  userGpsAvailable: boolean;
  rawCandidates: MosqueCandidate[];
  rankedMosques: MosqueRankedItem[];
  selectedMosqueId: string | null;

  // Actions
  setOriginCoords: (coords: { lat: number; lng: number }, name: string) => void;
  requestUserGeolocation: () => Promise<void>;
  setSortCriteria: (criteria: SortCriteria) => void;
  setMaxRadiusKm: (radius: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMosqueId: (id: string | null) => void;
  recomputeRankings: () => void;
  addFoundPlaces: (places: MosqueCandidate[]) => void;
  setRankedMosques: (items: MosqueRankedItem[]) => void;
}

export const useMosqueStore = create<MosqueStoreState>((set, get) => ({
  searchOriginName: 'Départ du trajet (Hub Rungis)',
  originCoords: { lat: 48.7538, lng: 2.3524 },
  sortCriteria: 'distance', // 'distance' or 'time' as requested by user
  maxRadiusKm: 30,
  searchQuery: '',
  isLoading: false,
  userGpsAvailable: 'geolocation' in navigator,
  rawCandidates: KNOWN_MOSQUES_DATABASE,
  rankedMosques: [],
  selectedMosqueId: null,

  setOriginCoords: (originCoords, searchOriginName) => {
    set({ originCoords, searchOriginName });
    get().recomputeRankings();
  },

  requestUserGeolocation: async () => {
    if (!('geolocation' in navigator)) return;
    set({ isLoading: true });

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      set({
        originCoords: coords,
        searchOriginName: 'Ma position GPS actuelle',
        isLoading: false,
      });

      get().recomputeRankings();
    } catch (err) {
      console.warn('Geolocation unavailable or denied, falling back to route origin:', err);
      set({ isLoading: false });
      get().recomputeRankings();
    }
  },

  setSortCriteria: (sortCriteria) => {
    set({ sortCriteria });
    get().recomputeRankings();
  },

  setMaxRadiusKm: (maxRadiusKm) => {
    set({ maxRadiusKm });
    get().recomputeRankings();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().recomputeRankings();
  },

  setSelectedMosqueId: (selectedMosqueId) => {
    set({ selectedMosqueId });
  },

  addFoundPlaces: (newPlaces) => {
    set((state) => {
      // Merge unique places by ID
      const existingIds = new Set(state.rawCandidates.map((c) => c.id));
      const filtered = newPlaces.filter((p) => !existingIds.has(p.id));
      return {
        rawCandidates: [...state.rawCandidates, ...filtered],
      };
    });
    get().recomputeRankings();
  },

  setRankedMosques: (rankedMosques) => {
    set({ rankedMosques });
  },

  recomputeRankings: () => {
    const { originCoords, rawCandidates, sortCriteria, maxRadiusKm, searchQuery } = get();
    const routeStore = useRouteStore.getState();
    const vehicle = routeStore.vehicle;
    const trafficFactor = routeStore.simulatedTrafficDelayFactor;

    // Filter by search text if any
    let candidates = rawCandidates;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    // Evaluate metrics for each candidate
    const evaluated = candidates.map((place) =>
      evaluatePlaceMetrics(originCoords, place, vehicle, trafficFactor)
    );

    // Filter by radius
    const filtered = filterPlacesByRadius(evaluated, maxRadiusKm);

    // Sort by requested criteria (distance or time)
    const sorted = sortRankedPlaces(filtered, sortCriteria);

    set({ rankedMosques: sorted });
  },
}));
