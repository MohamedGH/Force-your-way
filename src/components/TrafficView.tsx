import React from 'react';
import { useRouteStore } from '../store/route-store';
import { analyzeCongestion } from '../utils/traffic-analyzer';
import {
  Activity,
  AlertTriangle,
  Clock,
  Flame,
  Gauge,
  Sliders,
  TrendingUp,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const TrafficView: React.FC = () => {
  const {
    durationNoTrafficSec,
    durationWithTrafficSec,
    fuelResult,
    simulatedTrafficDelayFactor,
    setSimulatedTrafficDelayFactor,
  } = useRouteStore();

  const trafficAnalysis = analyzeCongestion(durationNoTrafficSec, durationWithTrafficSec);

  const nominalMinutes = Math.round(durationNoTrafficSec / 60);
  const actualMinutes = Math.round(durationWithTrafficSec / 60);
  const delayMinutes = Math.max(0, actualMinutes - nominalMinutes);

  const extraFuelAmount = fuelResult?.trafficExtraFuelAmount ?? 0;
  const extraCost = fuelResult?.trafficExtraCost ?? 0;
  const unit = fuelResult?.fuelUnit ?? 'L';

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-5 h-full overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${trafficAnalysis.badgeBg}`}
              >
                <Activity className="w-3.5 h-3.5" />
                {trafficAnalysis.badgeText}
              </span>
              <span className="text-xs text-slate-400">Indice de saturation</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5">
              Analyse du Trafic & Ralentissements
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {trafficAnalysis.description}
            </p>
          </div>

          {/* Congestion score pill */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 sm:text-right shrink-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Sévérité du Trafic
            </div>
            <div
              className="text-2xl font-black"
              style={{ color: trafficAnalysis.color }}
            >
              {trafficAnalysis.severityScore} / 100
            </div>
          </div>
        </div>

        {/* Progress gauge bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.max(5, Math.min(100, trafficAnalysis.severityScore))}%`,
              backgroundColor: trafficAnalysis.color,
            }}
          />
        </div>
      </div>

      {/* Direct Fuel Waste Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-rose-300 text-xs mb-1">
            <span className="font-semibold">Temps Perdu en Bouchons</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            +{delayMinutes} <span className="text-xs font-normal text-rose-300">min</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Trajet normal: {nominalMinutes} min → Trafic réel: {actualMinutes} min
          </p>
        </div>

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
            <span className="font-semibold">Carburant Gaspillé</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            +{extraFuelAmount} <span className="text-xs font-normal text-slate-400">{unit}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ralenti moteur + arrêts & redémarrages fréquents
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
            <span className="font-semibold">Surcoût Financier Net</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            +{extraCost.toFixed(2)} <span className="text-xs font-normal text-slate-400">€</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Surfacturation directement causée par la congestion
          </p>
        </div>
      </div>

      {/* Real-time Peak Hour Simulation Slider */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base text-white">
              Simulateur d'Heure de Pointe & Densité de Circulation
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
            x{simulatedTrafficDelayFactor.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Ajustez le niveau de congestion routière pour anticiper les heures de pointe (matin 8h-9h30, soir 17h-19h) et observer l'envolée du coût en carburant.
        </p>

        <input
          type="range"
          min="1.0"
          max="2.5"
          step="0.05"
          value={simulatedTrafficDelayFactor}
          onChange={(e) => setSimulatedTrafficDelayFactor(parseFloat(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />

        <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
          <span>1.0x (Fluide / Nuit)</span>
          <span>1.35x (Ralentissements)</span>
          <span>1.8x (Heure de Pointe)</span>
          <span>2.5x (Gridlock Total)</span>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-blue-950/20 border border-blue-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-semibold text-blue-200">
            Conseil d'éco-conduite en situation de bouchon
          </h4>
          <p className="text-xs text-blue-300/90 leading-relaxed">
            {trafficAnalysis.recommendation} Anticipez les ralentissements au frein moteur, activez le système Stop&Start et coupez la climatisation forte qui surconsomme à l'arrêt.
          </p>
        </div>
      </div>
    </div>
  );
};
