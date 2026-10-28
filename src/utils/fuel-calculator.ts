/**
 * Fuel & Energy Calculator with Traffic Congestion Impact
 * Pure functional calculation engine
 */

import { pipe, roundTo, clamp, Result, ok, err } from './fp';

export type FuelType = 'sp95' | 'sp98' | 'e10' | 'diesel' | 'gpl' | 'electric' | 'hybrid';

export interface VehicleConfig {
  type: 'citadine' | 'berline' | 'suv' | 'utilitaire' | 'moto' | 'custom';
  name: string;
  fuelType: FuelType;
  baseConsumption: number; // L/100km or kWh/100km for electric
  fuelPricePerUnit: number; // € per liter or € per kWh
  acEnabled: boolean; // Clim adds ~5-10%
  drivingStyle: 'eco' | 'normal' | 'sport'; // style factor: 0.9, 1.0, 1.2
}

export interface FuelCalculationInput {
  distanceKm: number;
  durationNoTrafficSec: number;
  durationWithTrafficSec: number;
  vehicle: VehicleConfig;
}

export interface FuelCalculationResult {
  distanceKm: number;
  durationFormatted: string;
  trafficDelayMinutes: number;
  trafficDelaySec: number;
  congestionRatio: number; // withTraffic / noTraffic
  nominalFuelAmount: number; // in L or kWh without traffic
  trafficExtraFuelAmount: number; // extra fuel caused specifically by traffic jams
  totalFuelAmount: number; // total fuel in L or kWh
  fuelUnit: string; // 'L' or 'kWh'
  nominalCost: number; // €
  trafficExtraCost: number; // € lost due to traffic
  totalCost: number; // €
  costPerKm: number; // €/km
  co2EmissionsKg: number; // kg of CO2
  fuelSavedIfOptimizedPercent?: number;
}

// Default fuel prices in France/EU (averages 2024-2026)
export const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  sp95: 1.88,
  sp98: 1.95,
  e10: 1.82,
  diesel: 1.76,
  gpl: 0.98,
  hybrid: 1.82,
  electric: 0.25, // €/kWh average home/public mix
};

// CO2 emission factors (kg CO2 per liter or kWh)
export const CO2_FACTORS: Record<FuelType, number> = {
  sp95: 2.392,
  sp98: 2.392,
  e10: 2.25,
  diesel: 2.64,
  gpl: 1.665,
  hybrid: 1.55,
  electric: 0.057, // France low carbon electricity mix average
};

// Preset vehicle templates
export const VEHICLE_PRESETS: Record<string, VehicleConfig> = {
  citadine_essence: {
    type: 'citadine',
    name: 'Citadine Essence (ex: Clio, 208, Polo)',
    fuelType: 'e10',
    baseConsumption: 5.6,
    fuelPricePerUnit: DEFAULT_FUEL_PRICES.e10,
    acEnabled: false,
    drivingStyle: 'normal',
  },
  berline_diesel: {
    type: 'berline',
    name: 'Berline Diesel (ex: 508, Passat, Série 3)',
    fuelType: 'diesel',
    baseConsumption: 5.8,
    fuelPricePerUnit: DEFAULT_FUEL_PRICES.diesel,
    acEnabled: false,
    drivingStyle: 'normal',
  },
  suv_hybride: {
    type: 'suv',
    name: 'SUV Hybride (ex: 3008, RAV4, Tucson)',
    fuelType: 'hybrid',
    baseConsumption: 6.2,
    fuelPricePerUnit: DEFAULT_FUEL_PRICES.hybrid,
    acEnabled: false,
    drivingStyle: 'normal',
  },
  utilitaire_diesel: {
    type: 'utilitaire',
    name: 'Utilitaire / Fourgon (ex: Master, Transit)',
    fuelType: 'diesel',
    baseConsumption: 8.9,
    fuelPricePerUnit: DEFAULT_FUEL_PRICES.diesel,
    acEnabled: false,
    drivingStyle: 'normal',
  },
  electrique: {
    type: 'berline',
    name: 'Véhicule Électrique (ex: Model 3, Mégane E-Tech, ID.4)',
    fuelType: 'electric',
    baseConsumption: 16.5, // kWh/100km
    fuelPricePerUnit: DEFAULT_FUEL_PRICES.electric,
    acEnabled: false,
    drivingStyle: 'normal',
  },
};

/**
 * Calculates multiplier for driving style and AC
 */
export const calculateAdjustmentMultiplier = (vehicle: VehicleConfig): number => {
  const styleMultiplier =
    vehicle.drivingStyle === 'eco' ? 0.9 : vehicle.drivingStyle === 'sport' ? 1.2 : 1.0;
  const acMultiplier = vehicle.acEnabled ? 1.07 : 1.0;
  return styleMultiplier * acMultiplier;
};

/**
 * Calculates stop-and-go idle fuel burn rate per hour of standstill/bouchon
 * Typically a running combustion engine in neutral uses 0.8L to 1.2L per hour,
 * plus repeated 1st/2nd gear accelerations in traffic jams increases this to 1.5L - 2.5L/h equivalent.
 */
export const getIdleFuelPerHour = (vehicle: VehicleConfig): number => {
  if (vehicle.fuelType === 'electric') {
    // Electric cars consume very little at complete stop (only heating/electronics, ~1.2 kW/h)
    return vehicle.acEnabled ? 1.8 : 0.8;
  }
  if (vehicle.fuelType === 'hybrid') {
    // Hybrids shut off engine when stopped or rolling slow on electric
    return 0.6;
  }
  if (vehicle.type === 'utilitaire') {
    return 1.8;
  }
  if (vehicle.type === 'suv') {
    return 1.4;
  }
  if (vehicle.type === 'moto') {
    return 0.4;
  }
  return 1.0; // standard passenger car
};

/**
 * Pure calculation function for fuel and cost taking traffic into account
 */
export const calculateTripFuelCost = (
  input: FuelCalculationInput
): Result<FuelCalculationResult, string> => {
  if (input.distanceKm < 0) {
    return err('Distance cannot be negative');
  }

  const { distanceKm, durationNoTrafficSec, durationWithTrafficSec, vehicle } = input;

  const validNoTrafficSec = Math.max(1, durationNoTrafficSec);
  const validWithTrafficSec = Math.max(validNoTrafficSec, durationWithTrafficSec);
  const trafficDelaySec = validWithTrafficSec - validNoTrafficSec;
  const trafficDelayHours = trafficDelaySec / 3600;
  const congestionRatio = validWithTrafficSec / validNoTrafficSec;

  const adjustments = calculateAdjustmentMultiplier(vehicle);
  const effectiveBaseConsumption = vehicle.baseConsumption * adjustments;

  // Nominal fuel consumption (free-flow conditions)
  const nominalFuel = (distanceKm / 100) * effectiveBaseConsumption;

  // Congestion impact calculation:
  // 1. Idle time during delays (heating/aircon/engine idle)
  const idleConsumption = trafficDelayHours * getIdleFuelPerHour(vehicle);

  // 2. Stop-and-go inefficiency penalty during congested portions:
  // When congestionRatio > 1.05, vehicle experiences repeated deceleration and re-acceleration.
  // The slowdown penalty scales with delay intensity, capped at +40% extra energy.
  const stopAndGoFactor = clamp(0, 0.4)((congestionRatio - 1) * 0.25);
  const dynamicTrafficWaste = nominalFuel * stopAndGoFactor;

  const trafficExtraFuel = idleConsumption + dynamicTrafficWaste;
  const totalFuel = nominalFuel + trafficExtraFuel;

  const price = vehicle.fuelPricePerUnit;
  const nominalCost = nominalFuel * price;
  const trafficExtraCost = trafficExtraFuel * price;
  const totalCost = totalFuel * price;
  const costPerKm = distanceKm > 0 ? totalCost / distanceKm : 0;

  const co2Factor = CO2_FACTORS[vehicle.fuelType] ?? 2.392;
  const co2EmissionsKg = totalFuel * co2Factor;

  const minutes = Math.round(validWithTrafficSec / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const durationFormatted =
    hours > 0 ? `${hours}h ${remainingMinutes.toString().padStart(2, '0')}min` : `${minutes} min`;

  return ok({
    distanceKm: roundTo(1)(distanceKm),
    durationFormatted,
    trafficDelayMinutes: roundTo(0)(trafficDelaySec / 60),
    trafficDelaySec: Math.round(trafficDelaySec),
    congestionRatio: roundTo(2)(congestionRatio),
    nominalFuelAmount: roundTo(2)(nominalFuel),
    trafficExtraFuelAmount: roundTo(2)(trafficExtraFuel),
    totalFuelAmount: roundTo(2)(totalFuel),
    fuelUnit: vehicle.fuelType === 'electric' ? 'kWh' : 'L',
    nominalCost: roundTo(2)(nominalCost),
    trafficExtraCost: roundTo(2)(trafficExtraCost),
    totalCost: roundTo(2)(totalCost),
    costPerKm: roundTo(3)(costPerKm),
    co2EmissionsKg: roundTo(2)(co2EmissionsKg),
  });
};
