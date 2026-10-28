/**
 * Multi-stop Route Optimizer & TSP (Travelling Salesperson Problem)
 * Pure functional algorithm with 2-Opt heuristic & Haversine distance matrix.
 */

import { Result, ok, err } from './fp';

export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  isOrigin?: boolean;
  isDestination?: boolean;
}

export interface OptimizedRouteResult {
  orderedWaypoints: LocationPoint[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  savedDistanceKm: number;
  savedPercentage: number;
  permutationIndices: number[];
}

/**
 * Pure Haversine formula to calculate great-circle distance between two points in km
 */
export const haversineDistanceKm = (
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates total path distance for an ordered list of points
 */
export const calculatePathDistanceKm = (
  points: readonly LocationPoint[],
  roundTrip: boolean = false
): number => {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistanceKm(points[i], points[i + 1]);
  }
  if (roundTrip && points.length > 2) {
    total += haversineDistanceKm(points[points.length - 1], points[0]);
  }
  return total;
};

/**
 * Pure 2-Opt swap heuristic to untangle crossing paths in a tour
 */
const twoOptSwap = (
  route: readonly LocationPoint[],
  i: number,
  k: number
): LocationPoint[] => {
  const newRoute: LocationPoint[] = [];
  // 1. Take route from 0 to i-1
  for (let c = 0; c < i; c++) {
    newRoute.push(route[c]);
  }
  // 2. Reverse route from i to k
  for (let c = k; c >= i; c--) {
    newRoute.push(route[c]);
  }
  // 3. Take route from k+1 to end
  for (let c = k + 1; c < route.length; c++) {
    newRoute.push(route[c]);
  }
  return newRoute;
};

/**
 * Optimizes the order of stops between origin (fixed at 0) and destination (fixed at end)
 * or round-trip where destination returns to origin.
 * Uses Nearest Neighbor initialization followed by 2-Opt local search refinement.
 */
export const optimizeWaypointsOrder = (
  points: readonly LocationPoint[],
  options: { roundTrip?: boolean; keepLastFixed?: boolean } = {}
): Result<OptimizedRouteResult, string> => {
  if (points.length < 2) {
    return err('At least 2 points are required to optimize a route');
  }

  const { roundTrip = false, keepLastFixed = true } = options;

  if (points.length === 2) {
    const dist = calculatePathDistanceKm(points, roundTrip);
    return ok({
      orderedWaypoints: [...points],
      originalDistanceKm: Math.round(dist * 10) / 10,
      optimizedDistanceKm: Math.round(dist * 10) / 10,
      savedDistanceKm: 0,
      savedPercentage: 0,
      permutationIndices: [0, 1],
    });
  }

  const originalDistance = calculatePathDistanceKm(points, roundTrip);

  // If there are 3 points or more:
  // Origin is fixed at index 0.
  const origin = points[0];
  const lastPoint = keepLastFixed && !roundTrip ? points[points.length - 1] : null;
  const intermediateStops = keepLastFixed && !roundTrip
    ? points.slice(1, points.length - 1)
    : points.slice(1);

  if (intermediateStops.length <= 1) {
    // Only 1 intermediate stop, cannot reorder
    return ok({
      orderedWaypoints: [...points],
      originalDistanceKm: Math.round(originalDistance * 10) / 10,
      optimizedDistanceKm: Math.round(originalDistance * 10) / 10,
      savedDistanceKm: 0,
      savedPercentage: 0,
      permutationIndices: points.map((_, i) => i),
    });
  }

  // 1. Nearest Neighbor construction for intermediate stops
  const unvisited = [...intermediateStops];
  const visitedOrder: LocationPoint[] = [];
  let currentLoc = origin;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistanceKm(currentLoc, unvisited[i]);
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    visitedOrder.push(nextStop);
    currentLoc = nextStop;
  }

  // Assemble full candidate tour
  let bestTour: LocationPoint[] = [origin, ...visitedOrder];
  if (lastPoint) {
    bestTour.push(lastPoint);
  }

  // 2. Run 2-Opt local search on mutable interior of tour (from index 1 to length-2)
  const startIndex = 1;
  const endIndex = lastPoint ? bestTour.length - 2 : bestTour.length - 1;

  let improvement = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improvement && iterations < maxIterations) {
    improvement = false;
    iterations++;

    let bestDist = calculatePathDistanceKm(bestTour, roundTrip);

    for (let i = startIndex; i < endIndex; i++) {
      for (let k = i + 1; k <= endIndex; k++) {
        const candidateTour = twoOptSwap(bestTour, i, k);
        const candidateDist = calculatePathDistanceKm(candidateTour, roundTrip);

        if (candidateDist < bestDist - 0.001) {
          bestTour = candidateTour;
          bestDist = candidateDist;
          improvement = true;
          break;
        }
      }
      if (improvement) break;
    }
  }

  const optimizedDistance = calculatePathDistanceKm(bestTour, roundTrip);
  const savedKm = Math.max(0, originalDistance - optimizedDistance);
  const savedPercent =
    originalDistance > 0 ? Math.round((savedKm / originalDistance) * 1000) / 10 : 0;

  // Map back to original indices
  const permutationIndices = bestTour.map((p) => points.findIndex((orig) => orig.id === p.id));

  return ok({
    orderedWaypoints: bestTour,
    originalDistanceKm: Math.round(originalDistance * 10) / 10,
    optimizedDistanceKm: Math.round(optimizedDistance * 10) / 10,
    savedDistanceKm: Math.round(savedKm * 10) / 10,
    savedPercentage: savedPercent,
    permutationIndices,
  });
};

/**
 * Generates an NxN distance matrix for a list of locations
 */
export const computeDistanceMatrix = (
  locations: readonly LocationPoint[]
): {
  matrix: number[][];
  names: string[];
} => {
  const names = locations.map((loc) => loc.name);
  const matrix: number[][] = locations.map((fromLoc) =>
    locations.map((toLoc) =>
      fromLoc.id === toLoc.id
        ? 0
        : Math.round(haversineDistanceKm(fromLoc, toLoc) * 10) / 10
    )
  );
  return { matrix, names };
};
