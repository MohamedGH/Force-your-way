import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTripFuelCost,
  VEHICLE_PRESETS,
  DEFAULT_FUEL_PRICES,
  CO2_FACTORS,
} from './fuel-calculator';
import { isOk, isErr } from './fp';

test('Fuel Calculator: Free-flow calculation with no traffic delay', () => {
  const citadine = VEHICLE_PRESETS.citadine_essence;
  const result = calculateTripFuelCost({
    distanceKm: 100,
    durationNoTrafficSec: 3600, // 1 hour
    durationWithTrafficSec: 3600, // no traffic delay
    vehicle: citadine,
  });

  assert.equal(isOk(result), true);
  if (isOk(result)) {
    const data = result.data;
    assert.equal(data.distanceKm, 100);
    assert.equal(data.trafficDelayMinutes, 0);
    assert.equal(data.congestionRatio, 1);
    // 100km * 5.6 L/100km = 5.6 L
    assert.equal(data.nominalFuelAmount, 5.6);
    assert.equal(data.trafficExtraFuelAmount, 0);
    assert.equal(data.totalFuelAmount, 5.6);
    // Cost: 5.6 * 1.82 = 10.19 €
    assert.equal(data.totalCost, Math.round(5.6 * DEFAULT_FUEL_PRICES.e10 * 100) / 100);
  }
});

test('Fuel Calculator: Traffic jam adds idle and stop-and-go fuel surcharge', () => {
  const citadine = VEHICLE_PRESETS.citadine_essence;
  const result = calculateTripFuelCost({
    distanceKm: 50,
    durationNoTrafficSec: 1800, // 30 min nominal
    durationWithTrafficSec: 5400, // 90 min (1 hour delay in bouchons)
    vehicle: citadine,
  });

  assert.equal(isOk(result), true);
  if (isOk(result)) {
    const data = result.data;
    assert.equal(data.trafficDelayMinutes, 60);
    assert.equal(data.congestionRatio, 3); // 3x slower
    // trafficExtraFuelAmount must be strictly greater than 0
    assert.ok(data.trafficExtraFuelAmount > 0);
    assert.ok(data.totalCost > data.nominalCost);
    assert.ok(data.trafficExtraCost > 0);
  }
});

test('Fuel Calculator: Handles electric vehicle with kWh and lower CO2 footprint', () => {
  const ev = VEHICLE_PRESETS.electrique;
  const result = calculateTripFuelCost({
    distanceKm: 200,
    durationNoTrafficSec: 7200,
    durationWithTrafficSec: 7200,
    vehicle: ev,
  });

  assert.equal(isOk(result), true);
  if (isOk(result)) {
    const data = result.data;
    assert.equal(data.fuelUnit, 'kWh');
    // 200km * 16.5 kWh/100km = 33 kWh
    assert.equal(data.nominalFuelAmount, 33);
    // CO2 for EV: 33 * 0.057 = ~1.88 kg
    assert.ok(data.co2EmissionsKg < 5); // Much lower than thermal
  }
});

test('Fuel Calculator: Error handling for negative distance', () => {
  const result = calculateTripFuelCost({
    distanceKm: -10,
    durationNoTrafficSec: 3600,
    durationWithTrafficSec: 3600,
    vehicle: VEHICLE_PRESETS.citadine_essence,
  });

  assert.equal(isErr(result), true);
});
