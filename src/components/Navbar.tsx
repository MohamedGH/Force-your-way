import React from 'react';
import { useNavigationStore, AppView } from '../store/navigation-store';
import { useRouteStore } from '../store/route-store';
import {
  MapPin,
  Flame,
  Activity,
  Grid3X3,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Compass,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentView, setCurrentView } = useNavigationStore();
  const {
    distanceMeters,
    durationWithTrafficSec,
    durationNoTrafficSec,
    fuelResult,
    trafficOverlayVisible,
    setTrafficOverlayVisible,
  } = useRouteStore();

  const distanceKm = Math.round(distanceMeters / 100) / 10;
  const trafficDelayMinutes = Math.max(
    0,
    Math.round((durationWithTrafficSec - durationNoTrafficSec) / 60)
  );
  const totalCost = fuelResult?.totalCost ?? Math.round((distanceKm * 0.056 * 1.82) * 100) / 100;

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'planner', label: 'Itinéraire', icon: MapPin },
    { id: 'nearest-mosque', label: 'Mosquées', icon: Compass },
    { id: 'traffic', label: 'Trafic & Bouchons', icon: Activity },
    { id: 'fuel-cost', label: 'Carburant', icon: Flame },
    { id: 'matrix', label: 'Matrice', icon: Grid3X3 },
    { id: 'presets', label: 'Exemples', icon: Sparkles },
  ];

  return (
    <>
      {/* Top Header for Desktop & Tablet */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  OptiRoute Carburant
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" /> Temps Réel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Optimiseur de distance multi-trajets & surcoût lié aux bouchons
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Traffic Badge */}
            {trafficDelayMinutes > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden xs:inline">Bouchons :</span>
                <span>+{trafficDelayMinutes} min</span>
              </div>
            ) : (
              <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Fluide</span>
              </div>
            )}

            {/* Total Cost Highlight */}
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1 rounded-xl text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Coût Estimé
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-400">
                {totalCost.toFixed(2)} €
              </div>
            </div>

            {/* Traffic Layer Toggle */}
            <button
              onClick={() => setTrafficOverlayVisible(!trafficOverlayVisible)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                trafficOverlayVisible
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Afficher/masquer les couches de trafic en direct"
              aria-label="Basculer le calque de trafic"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Calque Trafic</span>
            </button>
          </div>
        </div>

        {/* Desktop View Navigation Tabs */}
        <div className="hidden md:flex max-w-7xl mx-auto items-center gap-1 mt-2.5 pt-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile First Bottom Navigation Bar */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[58px] ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? 'bg-blue-500/20 text-blue-400' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 line-clamp-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
