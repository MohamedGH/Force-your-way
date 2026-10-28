import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistanceKm,
  calculatePathDistanceKm,
  optimizeWaypointsOrder,
  computeDistanceMatrix,
  LocationPoint,
} from './optimizer';
import { isOk } from './fp';

test('Optimizer: Haversine distance calculates accurate geographic distance', () => {
  // Paris to Lyon: approx 390 - 400 km straight line
  const paris = { lat: 48.8566, lng: 2.3522 };
  const lyon = { lat: 45.764, lng: 4.8357 };
  const dist = haversineDistanceKm(paris, lyon);

  assert.ok(dist > 380 && dist < 410, `Expected ~392km, got ${dist}`);
});

test('Optimizer: Multi-stop TSP optimization shortens crossing route', () => {
  // Create a deliberately zigzagging path between Paris, Lille (north), Lyon (south), Marseille (further south)
  const waypoints: LocationPoint[] = [
    { id: '1', name: 'Paris (Départ)', lat: 48.8566, lng: 2.3522, isOrigin: true },
    { id: '2', name: 'Marseille (Loin Sud)', lat: 43.2965, lng: 5.3698 }, // Far south
    { id: '3', name: 'Lyon (Milieu Sud)', lat: 45.764, lng: 4.8357 }, // Mid south
    { id: '4', name: 'Lille (Nord)', lat: 50.6292, lng: 3.0573 }, // North
    { id: '5', name: 'Nice (Arrivée)', lat: 43.7102, lng: 7.262, isDestination: true },
  ];

  const result = optimizeWaypointsOrder(waypoints, { keepLastFixed: true });
  assert.equal(isOk(result), true);

  if (isOk(result)) {
    const data = result.data;
    assert.ok(
      data.optimizedDistanceKm <= data.originalDistanceKm,
      `Optimized ${data.optimizedDistanceKm}km should be <= original ${data.originalDistanceKm}km`
    );
    assert.equal(data.orderedWaypoints[0].id, '1'); // Origin preserved
    assert.equal(data.orderedWaypoints[data.orderedWaypoints.length - 1].id, '5'); // Destination preserved
  }
});

test('Optimizer: Distance matrix computes symmetric pairwise distances', () => {
  const points: LocationPoint[] = [
    { id: 'A', name: 'Point A', lat: 48.85, lng: 2.35 },
    { id: 'B', name: 'Point B', lat: 45.75, lng: 4.85 },
  ];

  const { matrix, names } = computeDistanceMatrix(points);
  assert.equal(names.length, 2);
  assert.equal(matrix[0][0], 0);
  assert.equal(matrix[1][1], 0);
  assert.equal(matrix[0][1], matrix[1][0]);
  assert.ok(matrix[0][1] > 300);
});
