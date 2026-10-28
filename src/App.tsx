/**
 * OptiRoute Carburant & Trafic
 * Multi-stop route optimizer & real-time fuel cost calculator taking traffic into account.
 */

import React, { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Navbar } from './components/Navbar';
import { MapContainer } from './components/MapContainer';
import { RoutePlannerView } from './components/RoutePlannerView';
import { NearestMosqueView } from './components/NearestMosqueView';
import { TrafficView } from './components/TrafficView';
import { FuelCostView } from './components/FuelCostView';
import { DistanceMatrixView } from './components/DistanceMatrixView';
import { PresetsView } from './components/PresetsView';
import { QuotaWarningBanner } from './components/QuotaWarningBanner';
import { ToastErrors } from './components/ToastErrors';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNavigationStore } from './store/navigation-store';
import { useErrorStore } from './store/error-store';
import { Map as MapIcon, List, Eye } from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA1nJT-2LgjY-clgzJRdjSwB6zDr6DcDUk';

export default function App() {
  const { currentView } = useNavigationStore();
  const setQuotaExceeded = useErrorStore((s) => s.setQuotaExceeded);
  const [mobileSplitMode, setMobileSplitMode] = useState<'split' | 'map-only' | 'list-only'>('split');

  // Listen to Google Maps quota exceeded custom event
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, [setQuotaExceeded]);

  return (
    <ErrorBoundary>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['routes', 'places', 'geometry']}>
        <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
          {/* Quota Exceeded Sticky Notice Banner */}
          <QuotaWarningBanner />

          {/* Navigation Bar */}
          <Navbar />

          {/* Mobile Split Toggle Buttons (visible on mobile only) */}
          <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Affichage mobile :</span>
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setMobileSplitMode('split')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  mobileSplitMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Partagé
              </button>
              <button
                onClick={() => setMobileSplitMode('map-only')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                  mobileSplitMode === 'map-only' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3 h-3" />
                Carte
              </button>
              <button
                onClick={() => setMobileSplitMode('list-only')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
                  mobileSplitMode === 'list-only' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3 h-3" />
                Détails
              </button>
            </div>
          </div>

          {/* Main App Layout: Responsive Mobile-first + Desktop Dual-Pane */}
          <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
            {/* Left Content Column (Planner / Traffic / Fuel / Matrix / Presets) */}
            <section
              className={`w-full md:w-1/2 lg:w-[48%] flex flex-col border-r border-slate-800/80 overflow-y-auto ${
                mobileSplitMode === 'map-only' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {currentView === 'planner' && <RoutePlannerView />}
              {currentView === 'nearest-mosque' && <NearestMosqueView />}
              {currentView === 'traffic' && <TrafficView />}
              {currentView === 'fuel-cost' && <FuelCostView />}
              {currentView === 'matrix' && <DistanceMatrixView />}
              {currentView === 'presets' && <PresetsView />}
            </section>

            {/* Right Map Column */}
            <section
              className={`w-full md:w-1/2 lg:w-[52%] relative flex flex-col ${
                mobileSplitMode === 'list-only'
                  ? 'hidden md:flex'
                  : mobileSplitMode === 'map-only'
                  ? 'flex-1 h-full'
                  : 'h-[360px] sm:h-[420px] md:h-full md:flex-1'
              }`}
            >
              <MapContainer />
            </section>
          </main>

          {/* Floating Toast Error & Notification Alerts */}
          <ToastErrors />
        </div>
      </APIProvider>
    </ErrorBoundary>
  );
}
