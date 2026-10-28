import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { useRouteStore } from '../store/route-store';
import { useMosqueStore } from '../store/mosque-store';
import { useNavigationStore } from '../store/navigation-store';
import { useErrorStore } from '../store/error-store';
import { LocationPoint } from '../utils/optimizer';
import { Navigation, Plus, Compass } from 'lucide-react';

export const MapContainer: React.FC = () => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const mapsLib = useMapsLibrary('maps');
  const { currentView } = useNavigationStore();
  const { rankedMosques } = useMosqueStore();

  const {
    waypoints,
    trafficOverlayVisible,
    simulatedTrafficDelayFactor,
    updateRouteCalculation,
    addWaypoint,
  } = useRouteStore();

  const { addError, setQuotaExceeded } = useErrorStore();

  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);

  // Toggle Traffic Layer
  useEffect(() => {
    if (!map) return;

    if (trafficOverlayVisible) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, trafficOverlayVisible]);

  // Compute Route and Render Polylines
  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // Clean previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const origin = { lat: waypoints[0].lat, lng: waypoints[0].lng };
    const destination = {
      lat: waypoints[waypoints.length - 1].lat,
      lng: waypoints[waypoints.length - 1].lng,
    };

    // If routes library is available from Google Maps JS SDK
    if (routesLib && (routesLib as any).Route) {
      const intermediates = waypoints.slice(1, waypoints.length - 1).map((w) => ({
        lat: w.lat,
        lng: w.lng,
      }));

      const request: any = {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        intermediates: intermediates.length > 0 ? intermediates : undefined,
        travelMode: (routesLib as any).TravelMode?.DRIVE || 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
      };

      try {
        const computeFn =
          typeof (routesLib as any).Route.computeRoutes === 'function'
            ? (routesLib as any).Route.computeRoutes
            : new (routesLib as any).Route().computeRoutes;

        computeFn(request)
          .then(({ routes }: { routes: any[] }) => {
          if (routes && routes.length > 0) {
            const primaryRoute = routes[0];

            if (typeof primaryRoute.createPolylines === 'function') {
              const newPolylines = primaryRoute.createPolylines();
              newPolylines.forEach((p: google.maps.Polyline) => {
                p.setOptions({
                  strokeColor: '#3b82f6',
                  strokeWeight: 6,
                  strokeOpacity: 0.85,
                });
                p.setMap(map);
              });
              polylinesRef.current = newPolylines;
            }

            if (primaryRoute.viewport) {
              map.fitBounds(primaryRoute.viewport);
            }

            const dist = primaryRoute.distanceMeters ?? 50000;
            const durationSec = Math.round((primaryRoute.durationMillis ?? 3000000) / 1000);
            const durationTrafficSec = Math.round(durationSec * simulatedTrafficDelayFactor);

            updateRouteCalculation({
              distanceMeters: dist,
              durationNoTrafficSec: durationSec,
              durationWithTrafficSec: durationTrafficSec,
            });
          }
        })
        .catch((err: any) => {
          console.warn('Routes calculation falling back to native polyline:', err);
          renderFallbackPolyline();
        });
      } catch (err: any) {
        console.warn('Routes API synchronous invocation error:', err);
        renderFallbackPolyline();
      }
    } else {
      renderFallbackPolyline();
    }

    function renderFallbackPolyline() {
      if (!map) return;
      const path = waypoints.map((w) => ({ lat: w.lat, lng: w.lng }));

      const poly = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });
      polylinesRef.current = [poly];

      // Fit bounds to include all waypoints
      const bounds = new google.maps.LatLngBounds();
      waypoints.forEach((w) => bounds.extend({ lat: w.lat, lng: w.lng }));
      map.fitBounds(bounds, 50);

      // Estimate road distance (~1.25x haversine direct path)
      let totalMeters = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        const dLat = ((waypoints[i + 1].lat - waypoints[i].lat) * Math.PI) / 180;
        const dLng = ((waypoints[i + 1].lng - waypoints[i].lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((waypoints[i].lat * Math.PI) / 180) *
            Math.cos((waypoints[i + 1].lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalMeters += 6371000 * c * 1.25; // 1.25 road curvature factor
      }

      const nominalSec = Math.round((totalMeters / 1000 / 65) * 3600); // 65 km/h avg
      const trafficSec = Math.round(nominalSec * simulatedTrafficDelayFactor);

      updateRouteCalculation({
        distanceMeters: Math.round(totalMeters),
        durationNoTrafficSec: nominalSec,
        durationWithTrafficSec: trafficSec,
      });
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, waypoints, simulatedTrafficDelayFactor]);

  // Handle map click to add a new stop
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!e.detail.latLng) return;
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      const stopIndex = waypoints.length - 1;

      addWaypoint({
        name: `Arrêt étape ${stopIndex}`,
        lat,
        lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    },
    [waypoints.length, addWaypoint]
  );

  // Recenter map on all points
  const handleRecenter = () => {
    if (!map || waypoints.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    waypoints.forEach((w) => bounds.extend({ lat: w.lat, lng: w.lng }));
    map.fitBounds(bounds, 50);
  };

  const defaultCenter = waypoints.length > 0
    ? { lat: waypoints[0].lat, lng: waypoints[0].lng }
    : { lat: 48.8566, lng: 2.3522 };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 overflow-hidden">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={defaultCenter}
        defaultZoom={10}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleMapClick}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', minHeight: '340px' }}
      >
        {/* Advanced Markers for each waypoint */}
        {waypoints.map((point, index) => {
          const isFirst = index === 0;
          const isLast = index === waypoints.length - 1;

          let background = '#3b82f6';
          let glyphText = `${index}`;

          if (isFirst) {
            background = '#10b981'; // emerald for start
            glyphText = 'A';
          } else if (isLast) {
            background = '#ef4444'; // red for finish
            glyphText = 'B';
          }

          return (
            <AdvancedMarker
              key={point.id}
              position={{ lat: point.lat, lng: point.lng }}
              onClick={() => setSelectedPoint(point)}
              title={`${point.name} (${index + 1}/${waypoints.length})`}
            >
              <Pin
                background={background}
                borderColor="#ffffff"
                glyphColor="#ffffff"
                glyphText={glyphText}
                scale={1.1}
              />
            </AdvancedMarker>
          );
        })}

        {/* Mosques Markers when on Mosquées view */}
        {currentView === 'nearest-mosque' &&
          rankedMosques.slice(0, 10).map((mosque, idx) => {
            const isTop = idx === 0;
            return (
              <AdvancedMarker
                key={`mosque-${mosque.id}`}
                position={{ lat: mosque.lat, lng: mosque.lng }}
                title={`${mosque.name} - ${mosque.distanceKm} km (${mosque.durationWithTrafficMin} min)`}
              >
                <Pin
                  background={isTop ? '#10b981' : '#059669'}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  glyphText={`${idx + 1}`}
                  scale={isTop ? 1.25 : 1.0}
                />
              </AdvancedMarker>
            );
          })}
      </Map>

      {/* Floating Map Actions */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md transition flex items-center justify-center"
          title="Recadrer la carte sur tout le trajet"
          aria-label="Recadrer la carte"
        >
          <Compass className="w-5 h-5 text-blue-400" />
        </button>
      </div>

      {/* Map Hint Overlay on Mobile/Desktop */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-300 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Cliquez sur la carte pour ajouter un arrêt</span>
        </div>
      </div>
    </div>
  );
};
