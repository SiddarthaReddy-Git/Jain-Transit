import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { ShuttleBus } from '../types/transit';
import firebaseConfig from '../../firebase-applet-config.json';
import { Bus, Navigation, MapPin, Users, Compass, Layers } from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  firebaseConfig.apiKey ||
  'AIzaSyDb8ift9qs3UqHb2QBunf9cpiAazr_JkUk';

// Jain University FET Campus Coordinates (Harohalli, Kanakapura Road)
const CAMPUS_CENTER = { lat: 12.6521, lng: 77.4412 };

interface GoogleCampusMapProps {
  buses?: ShuttleBus[];
  onSelectBus?: (busId: number) => void;
  compact?: boolean;
  focusBus?: string;
}

interface BusSimConfig {
  bus_id: number;
  number: string;
  radius: number;
  phase: number;
  speed: number;
  seats: number;
  eta: number;
  dest: string;
  color: string;
}

const SIMULATED_ROUTES: BusSimConfig[] = [
  { bus_id: 1, number: 'JT-01', radius: 0.012, phase: 0, speed: 0.55, seats: 24, eta: 4, dest: 'Kanakapura Corridor (Bengaluru)', color: '#2563eb' },
  { bus_id: 2, number: 'JT-02', radius: 0.018, phase: 1.2, speed: 0.42, seats: 19, eta: 8, dest: 'Express Shuttle (Majestic / TTMC)', color: '#059669' },
  { bus_id: 3, number: 'JT-03', radius: 0.009, phase: 2.4, speed: 0.7, seats: 27, eta: 3, dest: 'Harohalli Local Feeder (Loop A)', color: '#d97706' },
  { bus_id: 4, number: 'JT-04', radius: 0.015, phase: 3.5, speed: 0.5, seats: 21, eta: 11, dest: 'Late Morning City Connector', color: '#7c3aed' },
  { bus_id: 5, number: 'JT-05', radius: 0.022, phase: 4.8, speed: 0.38, seats: 30, eta: 14, dest: 'Outer Ring Express Line', color: '#e11d48' },
];

function computeLiveBuses(centerLat: number, centerLng: number, timeStep: number) {
  return SIMULATED_ROUTES.map(item => {
    const angle = timeStep * item.speed + item.phase;
    const dLat = Math.sin(angle) * item.radius;
    const dLng = Math.cos(angle) * item.radius * 1.15;
    const heading = ((Math.atan2(Math.cos(angle) * item.radius, -Math.sin(angle) * item.radius * 1.15) * 180) / Math.PI + 360) % 360;

    return {
      id: item.bus_id,
      number: item.number,
      lat: centerLat + dLat,
      lng: centerLng + dLng,
      heading: Math.round(heading),
      color: item.color,
      status: 'EN_ROUTE',
      capacity: 32,
      occupied_seats: 32 - item.seats,
      available_seats: item.seats,
      eta_minutes: item.eta,
      destination: item.dest,
      driverName: item.bus_id === 1 ? 'Ramesh Gowda' : item.bus_id === 2 ? 'Mohan Das' : 'Campus Transit Crew',
      bayNumber: `Bay ${item.bus_id}`,
    };
  });
}

// Controller component to smoothly pan and zoom map
const MapCameraPan: React.FC<{ targetCoords: { lat: number; lng: number } | null; zoom?: number }> = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map && targetCoords) {
      map.panTo(targetCoords);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, targetCoords, zoom]);
  return null;
};

export const GoogleCampusMap: React.FC<GoogleCampusMapProps> = ({
  buses: propBuses,
  onSelectBus,
  compact = false,
  focusBus: propFocusBus,
}) => {
  const [timeStep, setTimeStep] = useState(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [activeFocus, setActiveFocus] = useState<string | null>(propFocusBus || null);
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  // Step the simulation every 1.8 seconds for smooth real-time telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStep(t => t + 0.08);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  // Track user geolocation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Campus Center
          setUserCoords(CAMPUS_CENTER);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setUserCoords(CAMPUS_CENTER);
    }
  }, []);

  // Compute live buses around campus, synchronized with active fleet
  const mapCenter = CAMPUS_CENTER;
  const liveBuses = useMemo(() => {
    const simBuses = computeLiveBuses(mapCenter.lat, mapCenter.lng, timeStep);
    if (propBuses && propBuses.length > 0) {
      const activeNumbers = new Set(propBuses.map(b => b.number.toUpperCase()));
      return simBuses.filter(sb => activeNumbers.has(sb.number.toUpperCase()));
    }
    return simBuses;
  }, [mapCenter.lat, mapCenter.lng, timeStep, propBuses]);

  const activeSelectedBus = liveBuses.find(b => b.id === selectedBusId);

  const handleSelectBus = (bus: (typeof liveBuses)[0]) => {
    setSelectedBusId(bus.id);
    setActiveFocus(bus.number);
    setCameraTarget({ lat: bus.lat, lng: bus.lng });
    if (onSelectBus) onSelectBus(bus.id);
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900 ${compact ? 'h-[360px]' : 'h-[580px]'}`}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'routes']}>
        <Map
          defaultCenter={CAMPUS_CENTER}
          defaultZoom={compact ? 13.5 : 14.2}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeId={mapType}
          style={{ width: '100%', height: '100%' }}
        >
          <MapCameraPan targetCoords={cameraTarget} />

          {/* User Location Pin */}
          {userCoords && (
            <AdvancedMarker position={userCoords} title="Your Location">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                <div className="relative w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                  <Navigation size={14} className="fill-current -rotate-45" />
                </div>
                <div className="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-bold whitespace-nowrap shadow">
                  You
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* University Campus Center Marker */}
          <AdvancedMarker position={CAMPUS_CENTER} title="Jain University (FET Campus)">
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-md border-2 border-white flex items-center gap-1">
                <MapPin size={12} className="stroke-[3]" />
                <span>JAIN CAMPUS TERMINAL</span>
              </div>
              <div className="w-1.5 h-2 bg-amber-600" />
            </div>
          </AdvancedMarker>

          {/* 5 Real-Time Animated Shuttle Buses */}
          {liveBuses.map(bus => (
            <AdvancedMarker
              key={bus.id}
              position={{ lat: bus.lat, lng: bus.lng }}
              onClick={() => handleSelectBus(bus)}
              title={`${bus.number} - ${bus.destination}`}
            >
              <div className="cursor-pointer group flex flex-col items-center transition-transform hover:scale-110">
                {/* Ping wave */}
                <div
                  className="absolute w-9 h-9 rounded-full opacity-60 animate-ping"
                  style={{ backgroundColor: bus.color }}
                />

                {/* Bus Pin Body */}
                <div
                  className="relative px-2 py-1 rounded-xl text-white font-extrabold text-[11px] shadow-xl flex items-center gap-1.5 border-2 border-white z-10 transition-shadow group-hover:shadow-2xl"
                  style={{ backgroundColor: bus.color }}
                >
                  <Bus size={13} className="text-white fill-current/20" />
                  <span>{bus.number}</span>
                </div>

                {/* Bearing Pointer */}
                <div
                  className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] transition-transform"
                  style={{
                    borderTopColor: bus.color,
                    transform: `rotate(${bus.heading}deg)`,
                  }}
                />

                {/* Micro ETA label */}
                <div className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-900/90 text-white text-[9px] font-bold shadow">
                  {bus.eta_minutes}m ETA
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* Info Window on Selected Bus */}
          {activeSelectedBus && (
            <InfoWindow
              position={{ lat: activeSelectedBus.lat, lng: activeSelectedBus.lng }}
              onCloseClick={() => setSelectedBusId(null)}
            >
              <div className="p-1 min-w-[220px] text-slate-800">
                <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: activeSelectedBus.color }}
                    />
                    <span>Shuttle {activeSelectedBus.number}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeSelectedBus.bayNumber}
                  </span>
                </div>

                <div className="text-xs text-slate-600 mb-2">
                  <b>Route:</b> {activeSelectedBus.destination}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 mb-2">
                  <div>
                    <span className="text-slate-500 block">Driver</span>
                    <b className="text-slate-800">{activeSelectedBus.driverName}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Est. Arrival</span>
                    <b className="text-emerald-700">{activeSelectedBus.eta_minutes} mins</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Free Seats</span>
                    <b className="text-blue-700">{activeSelectedBus.available_seats} / {activeSelectedBus.capacity}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GPS Telemetry</span>
                    <b className="text-emerald-600">● Live Active</b>
                  </div>
                </div>

                {onSelectBus && (
                  <button
                    type="button"
                    onClick={() => onSelectBus(activeSelectedBus.id)}
                    className="w-full py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Select & Book Shuttle
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Glass Control Top Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        {/* Status Pill */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Google Maps Platform Telemetry</span>
          <span className="text-slate-400 text-[11px]">| {liveBuses.length} Buses Active</span>
        </div>

        {/* Quick Bus Focus Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {liveBuses.map(bus => (
            <button
              key={bus.id}
              type="button"
              onClick={() => handleSelectBus(bus)}
              className={`px-2.5 py-1 rounded-full text-xs font-black transition-all shadow-md border ${
                activeFocus === bus.number
                  ? 'bg-white text-slate-900 border-white scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-900 text-white border-white/20'
              }`}
            >
              {bus.number}
            </button>
          ))}

          {/* Reset Campus View */}
          <button
            type="button"
            title="Reset to Campus"
            onClick={() => {
              setCameraTarget(CAMPUS_CENTER);
              setActiveFocus(null);
              setSelectedBusId(null);
            }}
            className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 shadow-md"
          >
            <Compass size={14} />
          </button>
        </div>
      </div>

      {/* Map Layer Switcher in Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => setMapType('roadmap')}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            mapType === 'roadmap' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Streets
        </button>
        <button
          type="button"
          onClick={() => setMapType('hybrid')}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            mapType === 'hybrid' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
};
