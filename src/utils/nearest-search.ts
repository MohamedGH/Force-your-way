/**
 * Nearest Place & Mosque Search & Ranking Engine
 * Pure functional calculations for sorting by distance, traffic duration, and fuel cost.
 */

import { haversineDistanceKm } from './optimizer';
import { VehicleConfig, calculateTripFuelCost } from './fuel-calculator';
import { analyzeCongestion, TrafficAnalysis } from './traffic-analyzer';
import { isOk, roundTo, pipe } from './fp';

export interface MosqueCandidate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  userRatingCount?: number;
}

export interface MosqueRankedItem extends MosqueCandidate {
  distanceKm: number;
  durationNoTrafficMin: number;
  durationWithTrafficMin: number;
  trafficDelayMin: number;
  trafficAnalysis: TrafficAnalysis;
  fuelCost: number;
  fuelAmount: number;
  fuelUnit: string;
}

export type SortCriteria = 'distance' | 'time' | 'fuelCost';

/**
 * Calculates travel distance, road estimated distance, duration with traffic,
 * and fuel cost for a target place from an origin coordinate.
 */
export const evaluatePlaceMetrics = (
  origin: { lat: number; lng: number },
  place: MosqueCandidate,
  vehicle: VehicleConfig,
  trafficFactor: number = 1.35
): MosqueRankedItem => {
  const straightDistKm = haversineDistanceKm(origin, { lat: place.lat, lng: place.lng });
  // Road factor typically 1.25x - 1.3x haversine in urban/suburban zones
  const roadDistKm = Math.max(0.2, roundTo(1)(straightDistKm * 1.25));

  // Average city/suburban driving speed (~35 km/h)
  const nominalDurationHours = roadDistKm / 35;
  const nominalSec = Math.round(nominalDurationHours * 3600);
  const actualSec = Math.round(nominalSec * Math.max(1.0, trafficFactor));

  const fuelResult = calculateTripFuelCost({
    distanceKm: roadDistKm,
    durationNoTrafficSec: nominalSec,
    durationWithTrafficSec: actualSec,
    vehicle,
  });

  const trafficAnalysis = analyzeCongestion(nominalSec, actualSec);

  const fuelCost = isOk(fuelResult) ? fuelResult.data.totalCost : roundTo(2)((roadDistKm / 100) * vehicle.baseConsumption * vehicle.fuelPricePerUnit);
  const fuelAmount = isOk(fuelResult) ? fuelResult.data.totalFuelAmount : roundTo(2)((roadDistKm / 100) * vehicle.baseConsumption);
  const fuelUnit = vehicle.fuelType === 'electric' ? 'kWh' : 'L';

  return {
    ...place,
    distanceKm: roadDistKm,
    durationNoTrafficMin: Math.max(1, Math.round(nominalSec / 60)),
    durationWithTrafficMin: Math.max(1, Math.round(actualSec / 60)),
    trafficDelayMin: Math.max(0, Math.round((actualSec - nominalSec) / 60)),
    trafficAnalysis,
    fuelCost,
    fuelAmount,
    fuelUnit,
  };
};

/**
 * Pure function to sort ranked places by chosen criteria (distance, duration with traffic, or fuel cost)
 */
export const sortRankedPlaces = (
  items: readonly MosqueRankedItem[],
  criteria: SortCriteria
): MosqueRankedItem[] => {
  const sorted = [...items];
  switch (criteria) {
    case 'distance':
      return sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    case 'time':
      return sorted.sort((a, b) => a.durationWithTrafficMin - b.durationWithTrafficMin);
    case 'fuelCost':
      return sorted.sort((a, b) => a.fuelCost - b.fuelCost);
    default:
      return sorted;
  }
};

/**
 * Filters places within maximum radius in km
 */
export const filterPlacesByRadius = (
  items: readonly MosqueRankedItem[],
  maxRadiusKm: number
): MosqueRankedItem[] => {
  return items.filter((item) => item.distanceKm <= maxRadiusKm);
};

// Seed dataset of prominent mosques across France & Europe
export const KNOWN_MOSQUES_DATABASE: MosqueCandidate[] = [
  // Île-de-France / Paris region
  {
    id: 'mosq-paris-grand',
    name: 'Grande Mosquée de Paris',
    lat: 48.8419,
    lng: 2.3553,
    address: '2bis Place du Puits de l\'Ermite, 75005 Paris',
    rating: 4.6,
    userRatingCount: 6240,
  },
  {
    id: 'mosq-st-denis',
    name: 'Mosquée Bilal de Saint-Denis',
    lat: 48.9325,
    lng: 2.3582,
    address: '152 Rue Gabriel Péri, 93200 Saint-Denis',
    rating: 4.5,
    userRatingCount: 890,
  },
  {
    id: 'mosq-creteil',
    name: 'Mosquée Sahaba de Créteil',
    lat: 48.7836,
    lng: 2.4589,
    address: '4 Rue Jean Gabin, 94000 Créteil',
    rating: 4.8,
    userRatingCount: 2100,
  },
  {
    id: 'mosq-evry',
    name: 'Grande Mosquée d\'Évry-Courcouronnes',
    lat: 48.6253,
    lng: 2.4287,
    address: '20 Rue Georges Brassens, 91080 Courcouronnes',
    rating: 4.7,
    userRatingCount: 3450,
  },
  {
    id: 'mosq-gennevilliers',
    name: 'Mosquée Ennour de Gennevilliers',
    lat: 48.9312,
    lng: 2.2987,
    address: '81 Rue Paul Vaillant Couturier, 92230 Gennevilliers',
    rating: 4.6,
    userRatingCount: 1200,
  },
  {
    id: 'mosq-nanterre',
    name: 'Mosquée Okba Ibn Nafi de Nanterre',
    lat: 48.8921,
    lng: 2.2154,
    address: '12 Rue des Alouettes, 92000 Nanterre',
    rating: 4.6,
    userRatingCount: 780,
  },
  {
    id: 'mosq-boulogne',
    name: 'Centre Culturel & Mosquée de Boulogne',
    lat: 48.8354,
    lng: 2.2412,
    address: 'Rue de Bellevue, 92100 Boulogne-Billancourt',
    rating: 4.4,
    userRatingCount: 520,
  },
  {
    id: 'mosq-ivry',
    name: 'Mosquée Annour d\'Ivry-sur-Seine',
    lat: 48.8142,
    lng: 2.3854,
    address: '2 Rue Truillot, 94200 Ivry-sur-Seine',
    rating: 4.7,
    userRatingCount: 1350,
  },
  {
    id: 'mosq-argenteuil',
    name: 'Mosquée Al-Ihsan d\'Argenteuil',
    lat: 48.9482,
    lng: 2.2491,
    address: '2 Boulevard de la Résistance, 95100 Argenteuil',
    rating: 4.8,
    userRatingCount: 2900,
  },

  // Lyon Region
  {
    id: 'mosq-lyon-grand',
    name: 'Grande Mosquée de Lyon',
    lat: 45.7352,
    lng: 4.8875,
    address: '146 Boulevard Pinel, 69008 Lyon',
    rating: 4.7,
    userRatingCount: 3800,
  },
  {
    id: 'mosq-villeurbanne',
    name: 'Mosquée Othmane de Villeurbanne',
    lat: 45.7712,
    lng: 4.8894,
    address: '51 Rue Octavie, 69100 Villeurbanne',
    rating: 4.7,
    userRatingCount: 1950,
  },

  // Marseille / South Region
  {
    id: 'mosq-marseille-capelette',
    name: 'Mosquée de la Capelette',
    lat: 43.2798,
    lng: 5.4052,
    address: 'Boulevard de la Capelette, 13010 Marseille',
    rating: 4.5,
    userRatingCount: 940,
  },
  {
    id: 'mosq-nice',
    name: 'Mosquée En-Nour de Nice',
    lat: 43.6742,
    lng: 7.1952,
    address: 'Rue de la Digue, 06200 Nice',
    rating: 4.6,
    userRatingCount: 820,
  },
  {
    id: 'mosq-cannes',
    name: 'Mosquée Al-Madina de Cannes-la-Bocca',
    lat: 43.5582,
    lng: 6.9654,
    address: 'Avenue Francis Tonner, 06150 Cannes',
    rating: 4.6,
    userRatingCount: 410,
  },
];
