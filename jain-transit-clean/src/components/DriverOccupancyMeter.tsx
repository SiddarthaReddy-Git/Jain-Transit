import React from 'react';
import { Users, Plus, Minus, RotateCcw, AlertOctagon } from 'lucide-react';

interface DriverOccupancyMeterProps {
  capacity: number;
  bookedSeats: number;
  walkInPassengers: number;
  onAdjustWalkIn: (delta: number) => Promise<void>;
  busNumber: string;
}

export const DriverOccupancyMeter: React.FC<DriverOccupancyMeterProps> = ({
  capacity,
  bookedSeats,
  walkInPassengers,
  onAdjustWalkIn,
  busNumber,
}) => {
  const [adjusting, setAdjusting] = React.useState(false);

  const handleAdjust = async (delta: number) => {
    setAdjusting(true);
    try {
      await onAdjustWalkIn(delta);
    } finally {
      setAdjusting(false);
    }
  };

  const totalOccupied = bookedSeats + walkInPassengers;
  const percent = Math.min(100, Math.round((totalOccupied / capacity) * 100));
  const remaining = Math.max(0, capacity - totalOccupied);

  let statusBg = 'bg-emerald-500';
  let statusText = 'Seats Available';
  let badgeTone = 'bg-emerald-100 text-emerald-800';

  if (totalOccupied >= capacity) {
    statusBg = 'bg-red-500';
    statusText = 'Maximum Capacity Reached';
    badgeTone = 'bg-red-100 text-red-800';
  } else if (percent >= 70) {
    statusBg = 'bg-amber-500';
    statusText = 'Filling Fast (Few Seats)';
    badgeTone = 'bg-amber-100 text-amber-800';
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="flex items-center justify-between pb-3 border-b border-white/40 mb-4">
        <div>
          <div className="kicker" style={{ margin: 0 }}>In-Cab Seat Counter</div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight" style={{ margin: '4px 0 0' }}>
            Live Occupancy Meter
          </h3>
        </div>
        <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${badgeTone}`}>
          {statusText}
        </span>
      </div>

      {/* Big Circular/Bar Headcount Indicator */}
      <div className="p-5 rounded-2xl bg-white/80 border border-white shadow-inner mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
            <Users size={16} />
            <span>Total Onboard</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-3xl font-black text-slate-900">{totalOccupied}</span>
            <span className="text-slate-400 font-bold text-lg"> / {capacity}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full ${statusBg} transition-all duration-300 rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Granular breakdown */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Online Booked</div>
            <div className="font-mono font-bold text-slate-800 text-base">{bookedSeats}</div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50">
            <div className="text-[10px] uppercase tracking-wider text-blue-600 font-extrabold">Walk-in Boarders</div>
            <div className="font-mono font-bold text-blue-800 text-base">{walkInPassengers}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Available Seats</div>
            <div className="font-mono font-bold text-emerald-700 text-base">{remaining}</div>
          </div>
        </div>
      </div>

      {/* Stepper Buttons for Driver */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 font-semibold">Tap to record walk-in students boarding at stops:</div>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            disabled={adjusting || walkInPassengers <= 0}
            onClick={() => handleAdjust(-1)}
            className="h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center gap-1 shadow-sm hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all"
            title="Minus 1 passenger"
          >
            <Minus size={20} />
            <span>1</span>
          </button>

          <button
            type="button"
            disabled={adjusting}
            onClick={() => handleAdjust(1)}
            className="h-14 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center gap-1 shadow-md hover:bg-blue-700 active:scale-95 transition-all"
            title="Add 1 passenger"
          >
            <Plus size={20} />
            <span>1</span>
          </button>

          <button
            type="button"
            disabled={adjusting}
            onClick={() => handleAdjust(5)}
            className="h-14 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center gap-1 shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            title="Add 5 passengers (rapid group boarding)"
          >
            <Plus size={20} />
            <span>5</span>
          </button>

          <button
            type="button"
            disabled={adjusting || walkInPassengers <= 0}
            onClick={() => handleAdjust(-walkInPassengers)}
            className="h-14 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs flex flex-col items-center justify-center gap-0.5 hover:bg-slate-200 active:scale-95 transition-all"
            title="Reset walk-ins to 0"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
