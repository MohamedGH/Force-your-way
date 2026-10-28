import React, { useState } from 'react';
import { useRouteStore } from '../store/route-store';
import { computeDistanceMatrix } from '../utils/optimizer';
import { Grid3X3, ArrowRight, Gauge, Flame } from 'lucide-react';

export const DistanceMatrixView: React.FC = () => {
  const { waypoints, vehicle } = useRouteStore();
  const [selectedCell, setSelectedCell] = useState<{ from: number; to: number } | null>(null);

  const { matrix, names } = computeDistanceMatrix(waypoints);

  // Compute fuel cost for each matrix distance
  const getFuelCost = (distanceKm: number): number => {
    const liters = (distanceKm / 100) * vehicle.baseConsumption;
    return Math.round(liters * vehicle.fuelPricePerUnit * 100) / 100;
  };

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-5 h-full overflow-y-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Matrice des Distances & Coûts entre Étapes
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Visualisez la distance et le coût en carburant entre chaque paire d'arrêts de votre itinéraire pour identifier les sauts les plus coûteux.
        </p>
      </div>

      {/* Selected Cell Detail Card */}
      {selectedCell && selectedCell.from !== selectedCell.to && (
        <div className="bg-blue-950/40 border border-blue-700/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white">
            <span className="font-semibold text-blue-300">
              {names[selectedCell.from]}
            </span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-blue-300">
              {names[selectedCell.to]}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Distance</div>
              <div className="text-sm font-bold text-white">
                {matrix[selectedCell.from][selectedCell.to]} km
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Coût Carburant</div>
              <div className="text-sm font-bold text-emerald-400">
                {getFuelCost(matrix[selectedCell.from][selectedCell.to]).toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 overflow-x-auto shadow-sm">
        <table className="w-full text-xs text-left text-slate-300">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="py-2.5 px-3 font-semibold text-slate-400">Origine \ Dest.</th>
              {names.map((name, idx) => (
                <th
                  key={idx}
                  className="py-2.5 px-3 font-semibold text-slate-200 text-center max-w-[120px] truncate"
                  title={name}
                >
                  {name.split(' (')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="border-b border-slate-800/60 hover:bg-slate-800/40 transition"
              >
                <td className="py-2.5 px-3 font-medium text-white max-w-[140px] truncate" title={names[rIdx]}>
                  {names[rIdx].split(' (')[0]}
                </td>
                {row.map((dist, cIdx) => {
                  const isDiag = rIdx === cIdx;
                  const isSelected =
                    selectedCell?.from === rIdx && selectedCell?.to === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onClick={() => !isDiag && setSelectedCell({ from: rIdx, to: cIdx })}
                      className={`py-2.5 px-3 text-center transition cursor-pointer select-none ${
                        isDiag
                          ? 'bg-slate-950/40 text-slate-600 cursor-default'
                          : isSelected
                          ? 'bg-blue-600/30 text-white font-bold ring-1 ring-blue-500'
                          : 'hover:bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {isDiag ? (
                        '-'
                      ) : (
                        <div>
                          <div className="font-semibold text-white">{dist} km</div>
                          <div className="text-[10px] text-emerald-400">
                            {getFuelCost(dist).toFixed(2)} €
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
