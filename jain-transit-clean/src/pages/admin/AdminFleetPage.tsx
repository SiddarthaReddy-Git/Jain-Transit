import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';
import { Plus, Minus, Bus, Users, MapPin, CheckCircle2, Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { ShuttleBus } from '../../types/transit';

export const AdminFleetPage: React.FC = () => {
  const { buses, adminAddBus, adminRemoveBus } = useTransit();

  // Tab mode: 'add' or 'remove'
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>(() => {
    const hash = window.location.hash;
    return hash.includes('tab=remove') ? 'remove' : 'add';
  });

  // Add Shuttle Form state
  const [busNumber, setBusNumber] = useState('');
  const [capacity, setCapacity] = useState(32);
  const [destination, setDestination] = useState('Bengaluru');
  const [driverName, setDriverName] = useState('');
  const [bayNumber, setBayNumber] = useState('Bay 2 (South Gate)');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Remove Shuttle Form state
  const [selectedBusIdToRemove, setSelectedBusIdToRemove] = useState<number | ''>('');
  const [removeReason, setRemoveReason] = useState('Maintenance & Depot Servicing');
  const [busPendingRemoval, setBusPendingRemoval] = useState<ShuttleBus | null>(null);

  // Listen to hash changes (e.g. from Dashboard quick link)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('tab=remove')) {
        setActiveTab('remove');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update selectedBusIdToRemove default when buses change
  useEffect(() => {
    if (buses.length > 0 && selectedBusIdToRemove === '') {
      setSelectedBusIdToRemove(buses[0].id);
    }
  }, [buses, selectedBusIdToRemove]);

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    setSubmitting(true);
    try {
      await adminAddBus({
        number: busNumber.toUpperCase(),
        capacity: Number(capacity),
        destination,
        routeName: `Jain University → ${destination} Shuttle`,
        driverName: driverName || 'Standby Driver',
        bayNumber,
      });
      setNotice(`Shuttle ${busNumber.toUpperCase()} added to active fleet list.`);
      setBusNumber('');
      setDriverName('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteRemove = async (bus: ShuttleBus) => {
    setSubmitting(true);
    try {
      await adminRemoveBus(bus.id);
      setNotice(`Shuttle ${bus.number} has been removed from active service.`);
      setBusPendingRemoval(null);
      if (selectedBusIdToRemove === bus.id) {
        const remaining = buses.filter(b => b.id !== bus.id);
        setSelectedBusIdToRemove(remaining.length > 0 ? remaining[0].id : '');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormRemoveBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusIdToRemove) return;
    const target = buses.find(b => b.id === Number(selectedBusIdToRemove));
    if (target) {
      setBusPendingRemoval(target);
    }
  };

  const selectedBusObject = buses.find(b => b.id === Number(selectedBusIdToRemove));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Transport Operations</div>
          <h2>Fleet, Drivers & Bay Allocations</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/10 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('add');
              setNotice('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Plus size={14} />
            <span>Add Shuttle</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('remove');
              setNotice('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'remove'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            <Minus size={14} />
            <span>Remove Shuttle</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form (Toggleable Add or Remove) */}
        <div className="card lg:col-span-1">
          {/* Action Tabs Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-white/40 mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('add');
                setNotice('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold text-center border transition-all ${
                activeTab === 'add'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
            >
              + Add Shuttle
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('remove');
                setNotice('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold text-center border transition-all ${
                activeTab === 'remove'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-rose-700'
              }`}
            >
              - Remove Shuttle
            </button>
          </div>

          {notice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 mb-4 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* TAB 1: Add Shuttle Form */}
          {activeTab === 'add' && (
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-3">
                Register New Shuttle
              </h3>

              <form onSubmit={handleAddBus}>
                <label>Bus Number</label>
                <input
                  type="text"
                  value={busNumber}
                  onChange={e => setBusNumber(e.target.value)}
                  placeholder="e.g. JT-06"
                  required
                />

                <label>Seating Capacity</label>
                <input
                  type="number"
                  min={12}
                  max={65}
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  required
                />

                <label>Primary Destination</label>
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                >
                  <option value="Bengaluru">Bengaluru (Banashankari / Majestic)</option>
                  <option value="Harohalli">Harohalli (Campus Loop & Town)</option>
                  <option value="Kanakapura">Kanakapura Town Direct</option>
                </select>

                <label>Bay Gate Assignment</label>
                <select
                  value={bayNumber}
                  onChange={e => setBayNumber(e.target.value)}
                >
                  <option value="Bay 1 (North Gate)">Bay 1 (North Gate)</option>
                  <option value="Bay 2 (South Gate)">Bay 2 (South Gate)</option>
                  <option value="Bay 3 (Shuttle Loop)">Bay 3 (Shuttle Loop)</option>
                  <option value="Bay 4 (Express Lane)">Bay 4 (Express Lane)</option>
                </select>

                <label>Assigned Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full mt-5 py-3"
                >
                  {submitting ? 'Registering...' : '+ Register Shuttle in Fleet'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Remove Shuttle Form */}
          {activeTab === 'remove' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Decommission / Remove Shuttle
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Remove a vehicle from active university telemetry, booking inventory, and bay allocation.
              </p>

              {buses.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  No shuttles currently registered in the fleet.
                </div>
              ) : (
                <form onSubmit={handleFormRemoveBus}>
                  <label>Select Shuttle to Remove</label>
                  <select
                    value={selectedBusIdToRemove}
                    onChange={e => setSelectedBusIdToRemove(Number(e.target.value))}
                    required
                  >
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.number} — {b.destination} ({b.bayNumber})
                      </option>
                    ))}
                  </select>

                  {/* Selected Bus Preview Card */}
                  {selectedBusObject && (
                    <div className="my-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-slate-700">
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="font-mono text-sm text-rose-900">{selectedBusObject.number}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px]">
                          {selectedBusObject.status}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <b>Route:</b> {selectedBusObject.destination}
                      </div>
                      <div className="text-slate-600">
                        <b>Driver:</b> {selectedBusObject.driverName} · <b>Bay:</b> {selectedBusObject.bayNumber}
                      </div>
                      <div className="text-slate-600">
                        <b>Occupancy:</b> {selectedBusObject.bookedSeats + selectedBusObject.walkInPassengers} / {selectedBusObject.capacity} passengers
                      </div>
                    </div>
                  )}

                  <label>Removal Reason</label>
                  <select
                    value={removeReason}
                    onChange={e => setRemoveReason(e.target.value)}
                  >
                    <option value="Maintenance & Depot Servicing">Maintenance & Depot Servicing</option>
                    <option value="End of Scheduled Route / Shift">End of Scheduled Route / Shift</option>
                    <option value="Corridor Redistribution">Corridor Redistribution</option>
                    <option value="Vehicle Standby / Temporary Out of Service">Vehicle Standby / Temporary Out of Service</option>
                    <option value="Driver Reassignment">Driver Reassignment</option>
                  </select>

                  <button
                    type="submit"
                    disabled={submitting || !selectedBusIdToRemove}
                    className="w-full mt-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    <span>- Remove Shuttle from Fleet</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Existing Fleet Table with Direct Remove Action */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/40 mb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Active University Shuttles ({buses.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live GPS telemetry, bay assignments, and quick decommission controls.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Bus #</th>
                  <th>Destination</th>
                  <th>Bay Gate</th>
                  <th>Driver</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(bus => {
                  const total = bus.bookedSeats + bus.walkInPassengers;
                  const percent = Math.min(100, Math.round((total / bus.capacity) * 100));

                  return (
                    <tr key={bus.id} className="hover:bg-white/50 transition-colors">
                      <td className="font-mono font-black text-slate-900">{bus.number}</td>
                      <td className="font-bold text-slate-800 text-xs">{bus.destination}</td>
                      <td className="text-xs text-blue-600 font-semibold">{bus.bayNumber}</td>
                      <td className="text-xs text-slate-600 font-medium">{bus.driverName}</td>
                      <td>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {total}/{bus.capacity} ({percent}%)
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          bus.status === 'EN_ROUTE' ? 'badge-ok' : bus.status === 'BOARDING' ? 'badge-warn' : 'badge-city'
                        }`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setBusPendingRemoval(bus)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title={`Remove shuttle ${bus.number}`}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {buses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No shuttles in fleet. Use "+ Add Shuttle" to register one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Removing Shuttle */}
      {busPendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setBusPendingRemoval(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Confirm Shuttle Removal
                </h3>
                <span className="text-xs text-slate-500">
                  Decommissioning from active operations
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to remove shuttle <b className="text-slate-900 font-mono">{busPendingRemoval.number}</b> ({busPendingRemoval.destination}) from service? This will unassign its bay slot ({busPendingRemoval.bayNumber}) and stop live GPS tracking.
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-5 text-xs text-slate-600 space-y-1">
              <div><b>Driver:</b> {busPendingRemoval.driverName}</div>
              <div><b>Bay:</b> {busPendingRemoval.bayNumber}</div>
              <div><b>Passengers currently booked:</b> {busPendingRemoval.bookedSeats + busPendingRemoval.walkInPassengers}</div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBusPendingRemoval(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleExecuteRemove(busPendingRemoval)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{submitting ? 'Removing...' : 'Yes, Remove Shuttle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
