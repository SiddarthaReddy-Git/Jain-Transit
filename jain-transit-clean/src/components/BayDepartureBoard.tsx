import React, { useState } from 'react';
import { ShuttleBus } from '../types/transit';
import { Volume2, VolumeX, AlertCircle, ArrowRight, ShieldCheck, Users } from 'lucide-react';

interface BayDepartureBoardProps {
  buses: ShuttleBus[];
  onSelectBus?: (busId: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPlayChime: () => void;
}

export const BayDepartureBoard: React.FC<BayDepartureBoardProps> = ({
  buses,
  onSelectBus,
  soundEnabled,
  onToggleSound,
  onPlayChime,
}) => {
  const [filterBay, setFilterBay] = useState<string>('ALL');

  const uniqueBays = Array.from(new Set(buses.map(b => b.bayNumber.split(' ')[0]))).filter(Boolean);

  const filteredBuses = filterBay === 'ALL'
    ? buses
    : buses.filter(b => b.bayNumber.startsWith(filterBay));

  return (
    <div className="card" style={{ marginBottom: 28 }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="kicker" style={{ margin: 0 }}>Campus Terminal Departures</div>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight" style={{ margin: '4px 0 0' }}>
            Live Bay Departure Board & Occupancy
          </h3>
        </div>

        {/* Audio Chime and Bay Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-white/60">
            <button
              type="button"
              onClick={() => setFilterBay('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${filterBay === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Bays
            </button>
            {uniqueBays.map(bay => (
              <button
                key={bay}
                type="button"
                onClick={() => setFilterBay(bay)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${filterBay === bay ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {bay}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute departure chime' : 'Enable departure chime'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 border border-white hover:bg-white text-slate-700 shadow-sm transition-all"
          >
            {soundEnabled ? <Volume2 size={15} className="text-blue-600" /> : <VolumeX size={15} className="text-slate-400" />}
            <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={onPlayChime}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Test Chime
          </button>
        </div>
      </div>

      {/* Departures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
        {filteredBuses.map(bus => {
          const totalOccupied = bus.bookedSeats + bus.walkInPassengers;
          const percent = Math.min(100, Math.round((totalOccupied / bus.capacity) * 100));
          const available = Math.max(0, bus.capacity - totalOccupied);

          let capacityTone = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          let capacityLabel = 'Seats Available';
          let barColor = 'bg-emerald-500';

          if (percent >= 90) {
            capacityTone = 'text-red-700 bg-red-50 border-red-200';
            capacityLabel = 'Standing Only / Full';
            barColor = 'bg-red-500';
          } else if (percent >= 65) {
            capacityTone = 'text-amber-700 bg-amber-50 border-amber-200';
            capacityLabel = 'Filling Fast';
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={bus.id}
              className="p-4 rounded-2xl bg-white/75 border border-white/80 shadow-sm hover:shadow-md hover:bg-white transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-slate-900 font-mono tracking-tight bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {bus.number}
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {bus.bayNumber}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${capacityTone}`}>
                    {capacityLabel}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-slate-500 font-semibold">Destination</div>
                  <div className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                    <span>{bus.destination}</span>
                    <ArrowRight size={14} className="text-slate-400" />
                  </div>
                </div>

                {/* Progress bar of Occupancy */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      Occupancy
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {totalOccupied} / {bus.capacity} seats ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div
                      className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>{available} free remaining</span>
                    <span className="text-slate-400">({bus.bookedSeats} booked · {bus.walkInPassengers} walk-in)</span>
                  </div>
                </div>

                {/* Stop Leg Indicator */}
                <div className="text-xs text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Next Milestone</div>
                  <div className="font-bold text-slate-700 truncate">
                    {bus.stops[bus.currentStopIndex]?.name || bus.routeName}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Departs: <b className="text-slate-800">{bus.departureTime}</b>
                </span>
                {onSelectBus && (
                  <button
                    type="button"
                    onClick={() => onSelectBus(bus.id)}
                    className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                  >
                    <span>Reserve</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
