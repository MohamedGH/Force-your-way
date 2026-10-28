import React, { useState } from 'react';
import { useRouteStore } from '../store/route-store';
import { useNavigationStore } from '../store/navigation-store';
import {
  MapPin,
  Sparkles,
  ArrowUpDown,
  Trash2,
  Plus,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  Navigation,
  Clock,
  Gauge,
  Flame,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const RoutePlannerView: React.FC = () => {
  const {
    waypoints,
    isOptimized,
    optimizationSavings,
    roundTrip,
    distanceMeters,
    durationWithTrafficSec,
    durationNoTrafficSec,
    fuelResult,
    removeWaypoint,
    reorderWaypoints,
    optimizeWaypoints,
    setRoundTrip,
    addWaypoint,
  } = useRouteStore();

  const { setCurrentView } = useNavigationStore();

  const [newPlaceName, setNewPlaceName] = useState('');

  const distanceKm = Math.round(distanceMeters / 100) / 10;
  const trafficDelayMin = Math.max(
    0,
    Math.round((durationWithTrafficSec - durationNoTrafficSec) / 60)
  );

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim()) return;

    // Default offset slightly around the last point
    const last = waypoints[waypoints.length - 1];
    const offsetLat = (Math.random() - 0.5) * 0.08;
    const offsetLng = (Math.random() - 0.5) * 0.08;

    addWaypoint({
      name: newPlaceName.trim(),
      lat: last ? last.lat + offsetLat : 48.8566,
      lng: last ? last.lng + offsetLng : 2.3522,
      address: newPlaceName.trim(),
    });
    setNewPlaceName('');
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5 h-full overflow-y-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Distance Totale</span>
          </div>
          <div className="text-lg font-bold text-white tracking-tight">
            {distanceKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Durée Estimée</span>
          </div>
          <div className="text-lg font-bold text-white tracking-tight">
            {Math.round(durationWithTrafficSec / 60)}{' '}
            <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          {trafficDelayMin > 0 && (
            <div className="text-[10px] text-amber-400 font-medium mt-0.5">
              +{trafficDelayMin} min bouchons
            </div>
          )}
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carburant Total</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 tracking-tight">
            {fuelResult?.totalCost.toFixed(2) ?? '0.00'}{' '}
            <span className="text-xs font-normal text-slate-400">€</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {fuelResult?.totalFuelAmount} {fuelResult?.fuelUnit}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>Coût au km</span>
          </div>
          <div className="text-lg font-bold text-white tracking-tight">
            {fuelResult?.costPerKm.toFixed(3) ?? '0.00'}{' '}
            <span className="text-xs font-normal text-slate-400">€/km</span>
          </div>
        </div>
      </div>

      {/* Route Optimization Banner if achieved */}
      {isOptimized && optimizationSavings && (
        <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 text-emerald-200 flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                <span>Trajet Optimisé avec Succès !</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  -{optimizationSavings.savedPercent}%
                </span>
              </div>
              <p className="text-xs text-emerald-300 mt-0.5">
                Gain : <strong>{optimizationSavings.savedKm} km</strong> économisés (~
                <strong>{optimizationSavings.savedCost.toFixed(2)} €</strong> d'essence préservés).
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('traffic')}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition"
          >
            Voir Trafic
          </button>
        </div>
      )}

      {/* Controls & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(e) => setRoundTrip(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Boucle / Aller-retour</span>
          </label>

          <button
            onClick={() => setCurrentView('nearest-mosque')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
            title="Trouver la mosquée la plus proche du départ ou sur le trajet"
          >
            <span>🕌</span>
            <span className="hidden sm:inline">Mosquée la plus proche</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* TSP Optimization Trigger */}
          <button
            onClick={optimizeWaypoints}
            disabled={waypoints.length < 3}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md transition ${
              waypoints.length >= 3
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
            title={
              waypoints.length < 3
                ? 'Ajoutez au moins 3 étapes pour optimiser'
                : 'Réorganiser automatiquement pour minimiser la distance et le carburant'
            }
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Optimiser l'Ordre des Étapes</span>
          </button>
        </div>
      </div>

      {/* Add Stop Input Form */}
      <form onSubmit={handleAddStop} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={newPlaceName}
            onChange={(e) => setNewPlaceName(e.target.value)}
            placeholder="Ajouter une étape (ex: Lyon, Entrepôt Sud, Villeurbanne...)"
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </form>

      {/* Waypoints List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
          <span>Étapes du parcours ({waypoints.length})</span>
          <span>Ordre de passage</span>
        </div>

        <div className="space-y-2">
          {waypoints.map((point, index) => {
            const isFirst = index === 0;
            const isLast = index === waypoints.length - 1;

            return (
              <div
                key={point.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      isFirst
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isLast
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {isFirst ? 'A' : isLast ? 'B' : index}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-white truncate">
                      {point.name}
                    </div>
                    {point.address && (
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {point.address}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Move Up */}
                  <button
                    onClick={() => reorderWaypoints(index, index - 1)}
                    disabled={isFirst}
                    className={`p-1.5 rounded-lg border transition ${
                      isFirst
                        ? 'opacity-20 cursor-not-allowed border-transparent'
                        : 'text-slate-400 hover:text-white bg-slate-800/80 border-slate-700'
                    }`}
                    title="Monter"
                    aria-label={`Monter ${point.name}`}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => reorderWaypoints(index, index + 1)}
                    disabled={isLast}
                    className={`p-1.5 rounded-lg border transition ${
                      isLast
                        ? 'opacity-20 cursor-not-allowed border-transparent'
                        : 'text-slate-400 hover:text-white bg-slate-800/80 border-slate-700'
                    }`}
                    title="Descendre"
                    aria-label={`Descendre ${point.name}`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeWaypoint(point.id)}
                    disabled={waypoints.length <= 2}
                    className={`p-1.5 rounded-lg border transition ${
                      waypoints.length <= 2
                        ? 'opacity-20 cursor-not-allowed border-transparent'
                        : 'text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 border-transparent'
                    }`}
                    title={
                      waypoints.length <= 2
                        ? 'Minimum 2 étapes requises'
                        : `Supprimer ${point.name}`
                    }
                    aria-label={`Supprimer ${point.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
