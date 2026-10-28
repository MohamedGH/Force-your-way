import React from 'react';
import { PRESET_ROUTES } from '../utils/route-data';
import { useRouteStore } from '../store/route-store';
import { useNavigationStore } from '../store/navigation-store';
import { Sparkles, MapPin, ArrowRight, Activity } from 'lucide-react';

export const PresetsView: React.FC = () => {
  const { loadPresetRoute } = useRouteStore();
  const { setCurrentView } = useNavigationStore();

  const handleSelectPreset = (id: string) => {
    loadPresetRoute(id);
    setCurrentView('planner');
  };

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-5 h-full overflow-y-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Scénarios & Trajets Types Pré-chargés
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Sélectionnez un itinéraire prêt à l'emploi comportant des zones d'embouteillages reconnues pour tester instantanément le calcul et l'optimisation.
        </p>
      </div>

      {/* Preset Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRESET_ROUTES.map((preset) => (
          <div
            key={preset.id}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between transition shadow-md group"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-blue-400 font-semibold">{preset.region}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Bouchons typiques
                </span>
              </div>

              <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition leading-snug">
                {preset.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {preset.description}
              </p>

              {/* Waypoints snippet */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  {preset.waypoints.length} étapes incluses :
                </div>
                {preset.waypoints.map((w, i) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-1.5 text-xs text-slate-300 truncate"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">{w.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSelectPreset(preset.id)}
              className="mt-5 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
            >
              <span>Charger cet itinéraire</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
