import React from 'react';
import { RouteStop } from '../types/transit';
import { CheckCircle2, Clock, MapPin, ArrowRight, Navigation, CircleDot, AlertTriangle } from 'lucide-react';

interface DriverStopChecklistProps {
  stops: RouteStop[];
  currentStopIndex: number;
  onAdvanceStop: (stopIndex: number, action: 'ARRIVE' | 'DEPART') => Promise<void>;
  busNumber: string;
}

export const DriverStopChecklist: React.FC<DriverStopChecklistProps> = ({
  stops,
  currentStopIndex,
  onAdvanceStop,
  busNumber,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleAction = async (idx: number, action: 'ARRIVE' | 'DEPART') => {
    setLoading(true);
    try {
      await onAdvanceStop(idx, action);
    } finally {
      setLoading(false);
    }
  };

  const currentStop = stops[currentStopIndex];
  const isArrivedAtCurrent = currentStop?.actualArrival && !currentStop?.actualDeparture;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="flex items-center justify-between pb-4 border-b border-white/40 mb-4">
        <div>
          <div className="kicker" style={{ margin: 0 }}>Driver Route Telemetry</div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight" style={{ margin: '4px 0 0' }}>
            Stop-by-Stop Checklist
          </h3>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
          {busNumber}
        </span>
      </div>

      {/* Prominent Active Stop Action Card */}
      {currentStop && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400/40 shadow-sm mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            Active Corridor Milestone ({currentStop.order} of {stops.length})
          </div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600 shrink-0" />
            <span>{currentStop.name}</span>
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Landmark: <b>{currentStop.landmark}</b> · Sched: <b>{currentStop.scheduledTime}</b>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              disabled={loading || Boolean(isArrivedAtCurrent)}
              onClick={() => handleAction(currentStopIndex, 'ARRIVE')}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isArrivedAtCurrent
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 opacity-90 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95'
              }`}
            >
              <CircleDot size={15} />
              <span>{isArrivedAtCurrent ? `Arrived (${currentStop.actualArrival})` : 'Mark Arrived at Stop'}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction(currentStopIndex, 'DEPART')}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Navigation size={15} />
              <span>Depart for Next Stop</span>
            </button>
          </div>
        </div>
      )}

      {/* Timeline of all stops */}
      <div className="space-y-3">
        {stops.map((stop, idx) => {
          const isCompleted = stop.status === 'COMPLETED';
          const isCurrent = idx === currentStopIndex;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={stop.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                isCurrent
                  ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/30'
                  : isCompleted
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-white/40 border-slate-200/60 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 bg-blue-100 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-100"></div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{stop.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">#{stop.order}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {stop.landmark} · <span className="font-semibold">{stop.scheduledTime}</span>
                  </div>
                  {(stop.actualArrival || stop.actualDeparture) && (
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      {stop.actualArrival && <span>Arr: {stop.actualArrival} </span>}
                      {stop.actualDeparture && <span>· Dep: {stop.actualDeparture}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? 'Passed' : isCurrent ? 'Active' : 'Upcoming'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
