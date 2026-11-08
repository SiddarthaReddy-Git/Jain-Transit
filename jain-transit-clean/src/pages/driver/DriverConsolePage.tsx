import React, { useState, useEffect, useRef } from 'react';
import { useTransit } from '../../context/TransitContext';
import { DriverStopChecklist } from '../../components/DriverStopChecklist';
import { DriverOccupancyMeter } from '../../components/DriverOccupancyMeter';
import { Play, Pause, Square, AlertTriangle, Radio, Navigation, CheckCircle2, MapPin, Bus } from 'lucide-react';

interface DriverConsolePageProps {
  onNavigate: (path: string) => void;
}

export const DriverConsolePage: React.FC<DriverConsolePageProps> = ({ onNavigate }) => {
  const {
    currentUser,
    buses,
    driverAdvanceStop,
    driverAdjustOccupancy,
    driverSetTripStatus,
    driverBroadcastGps,
  } = useTransit();

  // Find assigned bus for this driver (e.g. driver1 -> JT-01, driver5 -> JT-05, or default first)
  const assignedBus = buses.find(b => b.driverName.toLowerCase().includes(currentUser?.fullName?.toLowerCase() || '')) || buses[0];

  const [gpsStatus, setGpsStatus] = useState<string>('GPS broadcasting idle');
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const watchIdRef = useRef<number | null>(null);

  // Clean up geolocation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleStartTrip = async () => {
    if (!assignedBus) return;
    await driverSetTripStatus(assignedBus.id, 'EN_ROUTE');
    setNotice(`Trip started on ${assignedBus.number}. Real-time tracking broadcast active.`);

    // Start GPS watch
    if (navigator.geolocation) {
      setGpsActive(true);
      setGpsStatus('Live driver GPS transmitting...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          driverBroadcastGps(assignedBus.id, pos.coords.latitude, pos.coords.longitude, pos.coords.heading || 0);
          setGpsStatus(`GPS Active (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setGpsStatus('GPS permission denied. Using simulated corridor telemetry.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }
  };

  const handlePauseTrip = async () => {
    if (!assignedBus) return;
    await driverSetTripStatus(assignedBus.id, 'BOARDING');
    setNotice(`Trip paused for station boarding at ${assignedBus.stops[assignedBus.currentStopIndex]?.name}.`);
  };

  const handleEndTrip = async () => {
    if (!assignedBus) return;
    await driverSetTripStatus(assignedBus.id, 'COMPLETED');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsActive(false);
    setGpsStatus('Trip ended. Location broadcasting stopped.');
    setNotice(`Trip completed for ${assignedBus.number}. Log saved to transport records.`);
  };

  const handleReportProblem = async () => {
    if (!assignedBus) return;
    const issue = window.prompt('Describe vehicle problem (e.g., Heavy traffic delay, tire puncture, mechanical breakdown):');
    if (issue) {
      await driverSetTripStatus(assignedBus.id, 'PROBLEM', issue);
      setNotice(`Issue reported to Transport Control Desk: "${issue}"`);
    }
  };

  if (!assignedBus) {
    return (
      <div className="card text-center py-12">
        <Bus size={40} className="mx-auto text-slate-400 mb-2" />
        <h3>No Assigned Shuttle Found</h3>
        <p className="text-slate-500 text-sm">Please ask the campus transport officer to assign a vehicle.</p>
      </div>
    );
  }

  const isEnRoute = assignedBus.status === 'EN_ROUTE';

  return (
    <div className="driver-shell">
      {/* Header */}
      <div className="brand" style={{ margin: '8px 0 16px' }}>
        JAIN <span>TRANSIT</span>
        <small>Driver In-Cab Console</small>
      </div>

      <div className="card mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="kicker" style={{ margin: 0 }}>Driver Profile</div>
            <h2 className="text-2xl font-black text-slate-900" style={{ margin: '2px 0' }}>
              {currentUser?.fullName || 'Campus Driver'}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Assigned Shuttle: <b className="text-slate-800">{assignedBus.number}</b> ({assignedBus.destination})
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Bay Allocation: <b className="text-blue-600">{assignedBus.bayNumber}</b>
            </div>
          </div>

          <span
            className={`badge text-xs font-black px-3 py-1 ${
              isEnRoute ? 'badge-ok' : assignedBus.status === 'BOARDING' ? 'badge-warn' : 'badge-city'
            }`}
          >
            {assignedBus.status}
          </span>
        </div>

        {/* Live GPS Telemetry Indicator */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Radio size={16} className={gpsActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
            <span className="truncate">{gpsStatus}</span>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            {assignedBus.isSimulated ? 'AUTO-FEED' : 'HARDWARE-GPS'}
          </span>
        </div>

        {notice && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Primary In-Cab Trip Controls */}
        <div className="driver-actions">
          {!isEnRoute ? (
            <button
              type="button"
              onClick={handleStartTrip}
              className="btn btn-primary"
            >
              <Play size={16} />
              <span>Start Trip</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePauseTrip}
              className="btn btn-ghost"
            >
              <Pause size={16} />
              <span>Boarding Pause</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleEndTrip}
            className="btn btn-ghost"
          >
            <Square size={16} />
            <span>End Trip</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleReportProblem}
          className="w-full mt-2.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <AlertTriangle size={14} />
          <span>Report Breakdown / Road Obstacle</span>
        </button>
      </div>

      {/* Feature 1: Live Occupancy Stepper */}
      <DriverOccupancyMeter
        capacity={assignedBus.capacity}
        bookedSeats={assignedBus.bookedSeats}
        walkInPassengers={assignedBus.walkInPassengers}
        onAdjustWalkIn={delta => driverAdjustOccupancy(assignedBus.id, delta)}
        busNumber={assignedBus.number}
      />

      {/* Feature 2: Stop-by-Stop Checklist */}
      <DriverStopChecklist
        stops={assignedBus.stops}
        currentStopIndex={assignedBus.currentStopIndex}
        onAdvanceStop={(idx, action) => driverAdvanceStop(assignedBus.id, idx, action)}
        busNumber={assignedBus.number}
      />
    </div>
  );
};
