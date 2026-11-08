import React from 'react';
import { useTransit } from '../../context/TransitContext';
import { LiveCampusMap } from '../../components/LiveCampusMap';
import { Bus, Users, ShieldAlert, Route, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { buses, bookings, emergencies } = useTransit();

  const activeBuses = buses.filter(b => b.status === 'EN_ROUTE' || b.status === 'BOARDING');
  const availableBuses = buses.filter(b => b.status === 'IDLE');
  const totalPassengers = buses.reduce((acc, b) => acc + b.bookedSeats + b.walkInPassengers, 0);
  const pendingEmergencies = emergencies.filter(e => e.status === 'PENDING' || e.status === 'ACKNOWLEDGED').length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Transport Office Control Center</div>
          <h2>Fleet Telemetry & Dispatch</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-ok">
            ● GPS Stream Live
          </span>
          <button
            type="button"
            onClick={() => onNavigate('/admin/fleet')}
            className="btn btn-primary text-xs"
          >
            + Add Shuttle
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/admin/fleet?tab=remove')}
            className="btn text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold"
          >
            - Remove Shuttle
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stat-row mb-6">
        <div className="stat">
          <b>{activeBuses.length}</b>
          <span>Active Shuttles</span>
        </div>
        <div className="stat">
          <b>{availableBuses.length}</b>
          <span>Standby Buses</span>
        </div>
        <div className="stat">
          <b>{totalPassengers}</b>
          <span>Live Onboard Riders</span>
        </div>
        <div className="stat">
          <b>{bookings.length}</b>
          <span>Confirmed Bookings</span>
        </div>
        <div className="stat">
          <b className={pendingEmergencies > 0 ? 'text-rose-600' : ''}>{pendingEmergencies}</b>
          <span>Pending SOS Alerts</span>
        </div>
      </div>

      {/* Live Map Feed */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-slate-900 tracking-tight" style={{ margin: 0 }}>
            Corridor Live Map & Vehicle Positions
          </h3>
          <span className="text-xs text-slate-500 font-semibold">Real-time driver telemetry</span>
        </div>
        <LiveCampusMap buses={buses} />
      </div>

      {/* Real-time Fleet Occupancy & Stop Leg Status */}
      <div className="card">
        <div className="flex items-center justify-between pb-3 border-b border-white/40 mb-4">
          <div>
            <div className="kicker" style={{ margin: 0 }}>Ridership Telemetry</div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight" style={{ margin: 0 }}>
              Fleet Occupancy & Stop Progression
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/admin/fleet')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Manage fleet</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {buses.map(bus => {
            const total = bus.bookedSeats + bus.walkInPassengers;
            const percent = Math.min(100, Math.round((total / bus.capacity) * 100));
            const currentStop = bus.stops[bus.currentStopIndex];

            return (
              <div
                key={bus.id}
                className="p-4 rounded-2xl bg-white/80 border border-white/80 shadow-sm flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                    {bus.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{bus.destination}</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                        {bus.bayNumber}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        bus.status === 'EN_ROUTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {bus.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Driver: <b>{bus.driverName}</b> · Current Stop: <b className="text-slate-700">{currentStop?.name || 'Terminal'}</b>
                    </div>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div className="w-full md:w-56">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Occupancy</span>
                    <span className="font-mono">{total} / {bus.capacity} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
