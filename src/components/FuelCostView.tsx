import React from 'react';
import { useRouteStore } from '../store/route-store';
import {
  VEHICLE_PRESETS,
  DEFAULT_FUEL_PRICES,
  CO2_FACTORS,
  FuelType,
} from '../utils/fuel-calculator';
import {
  Flame,
  Zap,
  Car,
  Wind,
  Gauge,
  Leaf,
  DollarSign,
  TrendingDown,
  Percent,
} from 'lucide-react';

export const FuelCostView: React.FC = () => {
  const {
    vehicle,
    fuelResult,
    distanceMeters,
    durationNoTrafficSec,
    durationWithTrafficSec,
    setVehicle,
    setVehiclePreset,
  } = useRouteStore();

  const distanceKm = Math.round(distanceMeters / 100) / 10;
  const isElectric = vehicle.fuelType === 'electric';

  const fuelTypes: { id: FuelType; label: string }[] = [
    { id: 'e10', label: 'Essence SP95-E10' },
    { id: 'sp98', label: 'Essence SP98' },
    { id: 'diesel', label: 'Gazole / Diesel' },
    { id: 'hybrid', label: 'Hybride' },
    { id: 'electric', label: 'Électrique (kWh)' },
    { id: 'gpl', label: 'GPL' },
  ];

  // Compare cost with alternative vehicles for this exact trip
  const comparisons = Object.entries(VEHICLE_PRESETS).map(([key, preset]) => {
    const conso = preset.baseConsumption;
    const price = preset.fuelPricePerUnit;
    const nominal = (distanceKm / 100) * conso;
    const cost = nominal * price;
    const co2 = nominal * (CO2_FACTORS[preset.fuelType] ?? 2.39);
    return {
      key,
      name: preset.name,
      fuelType: preset.fuelType,
      cost: Math.round(cost * 100) / 100,
      co2: Math.round(co2 * 10) / 10,
      unit: preset.fuelType === 'electric' ? 'kWh' : 'L',
    };
  });

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-5 h-full overflow-y-auto">
      {/* Top Banner & Vehicle Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              Configuration du Véhicule & Carburant
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paramétrez les caractéristiques de votre véhicule pour un calcul au centime près.
            </p>
          </div>
        </div>

        {/* Quick Vehicle Presets */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Modèles types pré-configurés :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(VEHICLE_PRESETS).map(([key, preset]) => {
              const isSelected = vehicle.name === preset.name;
              return (
                <button
                  key={key}
                  onClick={() => setVehiclePreset(key)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{preset.name.split(' (')[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {preset.baseConsumption} {preset.fuelType === 'electric' ? 'kWh' : 'L'}/100
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Fuel Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Type d'Énergie
            </label>
            <select
              value={vehicle.fuelType}
              onChange={(e) => {
                const ft = e.target.value as FuelType;
                setVehicle({
                  fuelType: ft,
                  fuelPricePerUnit: DEFAULT_FUEL_PRICES[ft],
                });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {fuelTypes.map((ft) => (
                <option key={ft.id} value={ft.id}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Base Consumption */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Consommation Moyenne ({isElectric ? 'kWh/100km' : 'L/100km'})
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="30"
              value={vehicle.baseConsumption}
              onChange={(e) =>
                setVehicle({ baseConsumption: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Fuel Price */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Prix Unitaire (€ / {isElectric ? 'kWh' : 'Litre'})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="5"
              value={vehicle.fuelPricePerUnit}
              onChange={(e) =>
                setVehicle({ fuelPricePerUnit: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Modifiers (AC & Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
          {/* Driving Style */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Style de Conduite
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['eco', 'normal', 'sport'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setVehicle({ drivingStyle: style })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition ${
                    vehicle.drivingStyle === style
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {style === 'eco' ? '🌱 Éco (-10%)' : style === 'normal' ? 'Normal' : '⚡ Dynamique (+20%)'}
                </button>
              ))}
            </div>
          </div>

          {/* AC Toggle */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-4 p-2 bg-slate-800/60 rounded-xl">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-medium text-slate-200">
                Climatisation active (+7%)
              </span>
            </div>
            <input
              type="checkbox"
              checked={vehicle.acEnabled}
              onChange={(e) => setVehicle({ acEnabled: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Financial & Environmental Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Coût Carburant Total</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {fuelResult?.totalCost.toFixed(2) ?? '0.00'} €
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dont {fuelResult?.trafficExtraCost.toFixed(2) ?? '0.00'} € générés par les bouchons
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Consommation Totale</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {fuelResult?.totalFuelAmount ?? '0.00'} {fuelResult?.fuelUnit}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pour {distanceKm} km (soit {((fuelResult?.totalFuelAmount ?? 0) / (distanceKm || 1) * 100).toFixed(1)} {fuelResult?.fuelUnit}/100 réel)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Empreinte Carbone CO₂</span>
            <Leaf className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">
            {fuelResult?.co2EmissionsKg.toFixed(1) ?? '0.0'} kg
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Émissions directes du réservoir à la roue
          </p>
        </div>
      </div>

      {/* Multi-Vehicle Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-bold text-white mb-2">
          Comparatif de Coût selon la Motorisation pour ce Trajet ({distanceKm} km)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Estimez vos économies potentielles en changeant de carburant ou en passant à l'électrique.
        </p>

        <div className="space-y-2">
          {comparisons.map((c) => (
            <div
              key={c.key}
              className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{c.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Émissions : {c.co2} kg CO₂
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-emerald-400 text-sm">{c.cost.toFixed(2)} €</div>
                <div className="text-[10px] text-slate-400">
                  {(c.cost / (distanceKm || 1)).toFixed(3)} €/km
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
