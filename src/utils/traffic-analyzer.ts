/**
 * Real-Time Traffic & Bouchons Analyzer
 * Pure functional evaluation of congestion severity, delay penalties, and fuel loss.
 */

export type CongestionLevel = 'FLUIDE' | 'MODÉRÉ' | 'DENSE' | 'BOUCHON SÉVÈRE';

export interface TrafficAnalysis {
  level: CongestionLevel;
  delayMinutes: number;
  delayPercentage: number;
  severityScore: number; // 0 to 100
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  recommendation: string;
}

/**
 * Classifies traffic congestion level and provides actionable real-time insights
 */
export const analyzeCongestion = (
  durationNoTrafficSec: number,
  durationWithTrafficSec: number
): TrafficAnalysis => {
  const baseSec = Math.max(1, durationNoTrafficSec);
  const actualSec = Math.max(baseSec, durationWithTrafficSec);
  const delaySec = actualSec - baseSec;
  const delayMinutes = Math.round(delaySec / 60);
  const delayPercentage = Math.round((delaySec / baseSec) * 100);

  // Score from 0 (freeflow) to 100 (complete gridlock)
  const severityScore = Math.min(100, Math.round(delayPercentage * 1.5));

  if (delayPercentage < 8) {
    return {
      level: 'FLUIDE',
      delayMinutes,
      delayPercentage,
      severityScore,
      color: '#10b981', // emerald-500
      badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      badgeText: 'Trafic Fluide',
      description: 'Circulation normale sans ralentissement notable sur le parcours.',
      recommendation: 'Conditions idéales pour rouler. Vitesse de croisière optimale.',
    };
  }

  if (delayPercentage < 25) {
    return {
      level: 'MODÉRÉ',
      delayMinutes,
      delayPercentage,
      severityScore,
      color: '#eab308', // yellow-500
      badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      badgeText: 'Ralentissements Modérés',
      description: `Ralentissements ponctuels. Environ +${delayMinutes} min de retard estimé.`,
      recommendation: 'Adoptez une conduite souple pour minimiser la surconsommation.',
    };
  }

  if (delayPercentage < 50) {
    return {
      level: 'DENSE',
      delayMinutes,
      delayPercentage,
      severityScore,
      color: '#f97316', // orange-500
      badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
      badgeText: 'Trafic Dense & Accordéons',
      description: `Bouchons marqués sur plusieurs tronçons. +${delayMinutes} min de temps perdu.`,
      recommendation: 'Coupez le moteur aux arrêts prolongés (Start&Stop). Évitez les accélérations brusques.',
    };
  }

  return {
    level: 'BOUCHON SÉVÈRE',
    delayMinutes,
    delayPercentage,
    severityScore,
    color: '#ef4444', // red-500
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    badgeText: 'Bouchon Sévère / Paralysie',
    description: `Forte saturation du réseau routier. Durée du trajet accrue de +${delayPercentage}%.`,
    recommendation: 'Considérez un décalage du départ ou un contournement alternatif si disponible.',
  };
};
