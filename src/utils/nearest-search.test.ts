import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluatePlaceMetrics,
  sortRankedPlaces,
  filterPlacesByRadius,
  KNOWN_MOSQUES_DATABASE,
  MosqueCandidate,
} from './nearest-search';
import { VEHICLE_PRESETS } from './fuel-calculator';

const mockOrigin = { lat: 48.8566, lng: 2.3522 }; // Paris Centre

test('Nearest Search: Evaluates distance, traffic duration, and fuel cost', () => {
  const vehicle = VEHICLE_PRESETS.citadine_essence;
  const grandMosque = KNOWN_MOSQUES_DATABASE[0]; // Grande Mosquée de Paris (~2-3 km from centre)

  const ranked = evaluatePlaceMetrics(mockOrigin, grandMosque, vehicle, 1.35);

  assert.ok(ranked.distanceKm > 1 && ranked.distanceKm < 5, `Expected 1-5km, got ${ranked.distanceKm}`);
  assert.ok(ranked.durationWithTrafficMin >= ranked.durationNoTrafficMin);
  assert.ok(ranked.fuelCost > 0);
  assert.ok(ranked.trafficAnalysis.level !== undefined);
});

test('Nearest Search: Sorts list strictly by distance (nearest first)', () => {
  const vehicle = VEHICLE_PRESETS.citadine_essence;
  const candidates: MosqueCandidate[] = [
    { id: 'far', name: 'Far Place', lat: 45.75, lng: 4.85 }, // Lyon (~400km)
    { id: 'mid', name: 'Mid Place', lat: 48.93, lng: 2.35 }, // Saint-Denis (~10km)
    { id: 'near', name: 'Near Place', lat: 48.84, lng: 2.35 }, // Paris 5e (~2km)
  ];

  const ranked = candidates.map((c) => evaluatePlaceMetrics(mockOrigin, c, vehicle, 1.2));
  const sortedByDist = sortRankedPlaces(ranked, 'distance');

  assert.equal(sortedByDist[0].id, 'near');
  assert.equal(sortedByDist[1].id, 'mid');
  assert.equal(sortedByDist[2].id, 'far');
  assert.ok(sortedByDist[0].distanceKm < sortedByDist[1].distanceKm);
  assert.ok(sortedByDist[1].distanceKm < sortedByDist[2].distanceKm);
});

test('Nearest Search: Sorts list strictly by travel time needed to go (fastest first with traffic)', () => {
  const vehicle = VEHICLE_PRESETS.citadine_essence;
  const candidates: MosqueCandidate[] = [
    { id: 'm1', name: 'M1', lat: 48.93, lng: 2.35 },
    { id: 'm2', name: 'M2', lat: 48.84, lng: 2.35 },
    { id: 'm3', name: 'M3', lat: 48.78, lng: 2.45 },
  ];

  const ranked = candidates.map((c) => evaluatePlaceMetrics(mockOrigin, c, vehicle, 1.5));
  const sortedByTime = sortRankedPlaces(ranked, 'time');

  assert.ok(sortedByTime[0].durationWithTrafficMin <= sortedByTime[1].durationWithTrafficMin);
  assert.ok(sortedByTime[1].durationWithTrafficMin <= sortedByTime[2].durationWithTrafficMin);
});

test('Nearest Search: Filters out places exceeding maximum radius', () => {
  const vehicle = VEHICLE_PRESETS.citadine_essence;
  const ranked = KNOWN_MOSQUES_DATABASE.map((c) =>
    evaluatePlaceMetrics(mockOrigin, c, vehicle, 1.2)
  );

  const within15km = filterPlacesByRadius(ranked, 15);
  // Paris region mosques will be kept, Lyon/Marseille/Nice will be filtered out
  assert.ok(within15km.length > 0);
  within15km.forEach((place) => {
    assert.ok(place.distanceKm <= 15, `Place ${place.name} has ${place.distanceKm}km > 15km`);
  });
});
