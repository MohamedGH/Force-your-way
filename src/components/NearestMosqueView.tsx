import React, { useEffect, useState } from 'react';
import { useMosqueStore } from '../store/mosque-store';
import { useRouteStore } from '../store/route-store';
import { useNavigationStore } from '../store/navigation-store';
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import {
  Compass,
  ArrowUpDown,
  Navigation,
  Clock,
  Flame,
  Star,
  MapPin,
  Search,
  Check,
  Plus,
  ArrowRight,
  Activity,
  LocateFixed,
  Sparkles,
} from 'lucide-react';

export const NearestMosqueView: React.FC = () => {
  const {
    originCoords,
    searchOriginName,
    sortCriteria,
    maxRadiusKm,
    searchQuery,
    rankedMosques,
    isLoading,
    setOriginCoords,
    requestUserGeolocation,
    setSortCriteria,
    setMaxRadiusKm,
    setSearchQuery,
    recomputeRankings,
    addFoundPlaces,
  } = useMosqueStore();

  const { waypoints, addWaypoint, updateWaypoint } = useRouteStore();
  const { setCurrentView } = useNavigationStore();
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [isSearchingLiveGmp, setIsSearchingLiveGmp] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize rankings on mount
  useEffect(() => {
    recomputeRankings();
  }, []);

  // Sync origin with first waypoint if not using GPS
  const handleSelectWaypointAsOrigin = (wpId: string) => {
    const wp = waypoints.find((w) => w.id === wpId);
    if (wp) {
      setOriginCoords({ lat: wp.lat, lng: wp.lng }, wp.name);
    }
  };

  // Perform live search via Google Maps Places API New
  const handleLiveGoogleSearch = async () => {
    if (!placesLib || !(placesLib as any).Place) {
      recomputeRankings();
      return;
    }

    setIsSearchingLiveGmp(true);
    try {
      // Modern Places API New searchNearby
      const request: any = {
        fields: ['displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'id'],
        locationRestriction: {
          center: originCoords,
          radius: maxRadiusKm * 1000,
        },
        includedTypes: ['mosque', 'place_of_worship'],
        maxResultCount: 15,
      };

      const result = await (placesLib as any).Place.searchNearby(request);
      if (result && result.places && result.places.length > 0) {
        const mapped = result.places.map((p: any) => ({
          id: p.id || `live-${Math.random()}`,
          name: typeof p.displayName === 'string' ? p.displayName : p.displayName?.text || 'Mosquée',
          lat: typeof p.location?.lat === 'function' ? p.location.lat() : p.location?.lat ?? originCoords.lat,
          lng: typeof p.location?.lng === 'function' ? p.location.lng() : p.location?.lng ?? originCoords.lng,
          address: p.formattedAddress || 'Adresse disponible sur la carte',
          rating: p.rating,
          userRatingCount: p.userRatingCount,
        }));
        addFoundPlaces(mapped);
      }
    } catch (err) {
      console.warn('Places API searchNearby completed with database fallback:', err);
    } finally {
      setIsSearchingLiveGmp(false);
      recomputeRankings();
    }
  };

  // Action: Add mosque as a waypoint to the route planner
  const handleAddAsWaypoint = (mosque: typeof rankedMosques[0]) => {
    addWaypoint({
      name: mosque.name,
      lat: mosque.lat,
      lng: mosque.lng,
      address: mosque.address,
    });

    setSuccessToast(`"${mosque.name}" ajoutée à l'itinéraire !`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Action: Set mosque as final destination
  const handleSetAsDestination = (mosque: typeof rankedMosques[0]) => {
    const lastPoint = waypoints[waypoints.length - 1];
    if (lastPoint) {
      updateWaypoint(lastPoint.id, {
        name: mosque.name,
        lat: mosque.lat,
        lng: mosque.lng,
        address: mosque.address,
      });
    } else {
      addWaypoint({
        name: mosque.name,
        lat: mosque.lat,
        lng: mosque.lng,
        address: mosque.address,
      });
    }

    setCurrentView('planner');
    if (map) {
      map.panTo({ lat: mosque.lat, lng: mosque.lng });
      map.setZoom(13);
    }
  };

  const handleFocusOnMap = (mosque: typeof rankedMosques[0]) => {
    if (map) {
      map.panTo({ lat: mosque.lat, lng: mosque.lng });
      map.setZoom(14);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5 h-full overflow-y-auto">
      {/* Title & Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                🕌
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Recherche de Mosquée la Plus Proche
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Classement en temps réel par distance kilométrique ou par temps de trajet estimé avec bouchons et coût en carburant.
            </p>
          </div>

          {/* Quick GPS Geolocation Trigger */}
          <button
            onClick={requestUserGeolocation}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md active:scale-95 shrink-0"
            title="Localiser ma position actuelle"
          >
            <LocateFixed className="w-4 h-4 text-white" />
            <span>{isLoading ? 'Localisation...' : 'Autour de moi (GPS)'}</span>
          </button>
        </div>

        {/* Origin Selector */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Point de départ de référence :
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{searchOriginName}</span>
            </span>

            {waypoints.map((wp, idx) => (
              <button
                key={wp.id}
                onClick={() => handleSelectWaypointAsOrigin(wp.id)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition ${
                  searchOriginName === wp.name
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {idx === 0 ? 'Départ' : idx === waypoints.length - 1 ? 'Arrivée' : `Étape ${idx}`} :{' '}
                {wp.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting Toggle (Distance vs Time) */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Trier les résultats par :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setSortCriteria('distance')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                sortCriteria === 'distance'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              <span>Distance (La plus proche)</span>
            </button>

            <button
              onClick={() => setSortCriteria('time')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                sortCriteria === 'time'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Temps (Le plus rapide)</span>
            </button>

            <button
              onClick={() => setSortCriteria('fuelCost')}
              className={`hidden sm:flex p-2.5 rounded-xl border items-center justify-center gap-2 text-xs font-bold transition ${
                sortCriteria === 'fuelCost'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Carburant (Le moins cher)</span>
            </button>
          </div>
        </div>

        {/* Filters: Search query + Radius */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer par nom ou ville..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-400 shrink-0">Rayon :</span>
            {[10, 20, 35, 50, 100].map((radius) => (
              <button
                key={radius}
                onClick={() => setMaxRadiusKm(radius)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 ${
                  maxRadiusKm === radius
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {radius} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn shadow-md">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Mosques Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
          <span>
            {rankedMosques.length} mosquée(s) trouvée(s) (Classées par{' '}
            {sortCriteria === 'distance'
              ? 'distance'
              : sortCriteria === 'time'
              ? 'temps de trajet'
              : 'coût'}
            )
          </span>
          <span>Estimation trajet & trafic</span>
        </div>

        {rankedMosques.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              Aucune mosquée trouvée dans un rayon de {maxRadiusKm} km.
            </p>
            <p className="text-xs text-slate-500">
              Élargissez le rayon de recherche ou sélectionnez un autre point de référence.
            </p>
            <button
              onClick={() => setMaxRadiusKm(100)}
              className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl border border-slate-700 transition"
            >
              Élargir à 100 km
            </button>
          </div>
        ) : (
          rankedMosques.map((mosque, idx) => {
            const isTopRanked = idx === 0;

            return (
              <div
                key={mosque.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition shadow-md hover:border-slate-700 flex flex-col gap-3 ${
                  isTopRanked
                    ? 'border-emerald-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        isTopRanked
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">
                          {mosque.name}
                        </h3>
                        {isTopRanked && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {sortCriteria === 'distance' ? 'La plus proche' : 'La plus rapide'}
                          </span>
                        )}
                      </div>
                      {mosque.address && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{mosque.address}</p>
                      )}
                      {mosque.rating && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-bold">{mosque.rating.toFixed(1)}</span>
                          {mosque.userRatingCount && (
                            <span className="text-slate-400">({mosque.userRatingCount} avis)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Traffic Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${mosque.trafficAnalysis.badgeBg}`}
                  >
                    {mosque.trafficAnalysis.badgeText}
                  </span>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                  <div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-blue-400" />
                      <span>Distance</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {mosque.distanceKm} <span className="text-[10px] font-normal text-slate-400">km</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Temps réel</span>
                    </div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {mosque.durationWithTrafficMin}{' '}
                      <span className="text-[10px] font-normal text-slate-400">min</span>
                    </div>
                    {mosque.trafficDelayMin > 0 && (
                      <div className="text-[9px] text-rose-400">+{mosque.trafficDelayMin}m bouchon</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-emerald-400" />
                      <span>Coût estimé</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {mosque.fuelCost.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">€</span>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {mosque.fuelAmount} {mosque.fuelUnit}
                    </div>
                  </div>
                </div>

                {/* Actions: Add to route, set as destination, view on map */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleFocusOnMap(mosque)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 transition"
                  >
                    Voir sur la carte
                  </button>
                  <button
                    onClick={() => handleAddAsWaypoint(mosque)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter à l'itinéraire</span>
                  </button>
                  <button
                    onClick={() => handleSetAsDestination(mosque)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
                  >
                    <span>Y aller (Destination)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
