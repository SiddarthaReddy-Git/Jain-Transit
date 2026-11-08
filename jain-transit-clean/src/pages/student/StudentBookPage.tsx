import React, { useState, useEffect } from 'react';
import { useTransit } from '../../context/TransitContext';
import { ArrowLeft, CheckCircle2, AlertCircle, Users, Bus } from 'lucide-react';

interface StudentBookPageProps {
  onNavigate: (path: string) => void;
  initialBusId?: number;
  initialDest?: string;
}

export const StudentBookPage: React.FC<StudentBookPageProps> = ({
  onNavigate,
  initialBusId,
  initialDest,
}) => {
  const { buses, createBooking, bookings, cancelBooking, currentUser } = useTransit();

  const [destination, setDestination] = useState<string>(initialDest || 'Bengaluru');
  const [selectedBusId, setSelectedBusId] = useState<number | ''>(initialBusId || (buses[0]?.id ?? ''));
  const [travelType, setTravelType] = useState<'NORMAL' | 'EMERGENCY'>('NORMAL');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Available buses to this destination
  const availableBuses = buses.filter(b => b.destination.toLowerCase() === destination.toLowerCase());

  // Set default bus if current selection doesn't match destination
  useEffect(() => {
    if (availableBuses.length > 0 && !availableBuses.some(b => b.id === Number(selectedBusId))) {
      setSelectedBusId(availableBuses[0].id);
    }
  }, [destination, availableBuses, selectedBusId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedBusId) {
      setErrorMsg('Please select a college shuttle.');
      return;
    }

    setSubmitting(true);
    try {
      const bk = await createBooking(Number(selectedBusId), destination, travelType);
      setSuccessMsg(`Seat #${bk.seatNumber} on ${bk.busNumber} to ${bk.destination} confirmed. Departure at ${bk.bayNumber}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const studentBookings = bookings.filter(b => b.studentId === currentUser?.id);

  return (
    <div>
      <div className="page-head">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/student')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 bg-transparent border-0 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to lounge
          </button>
          <h2>Reserve a Seat</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reservation Form */}
        <div className="card">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight pb-3 border-b border-white/40 mb-4">
            Seat Request
          </h3>

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-start gap-2 mb-4">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-start gap-2 mb-4">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>Destination</label>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
            >
              <option value="Bengaluru">Bengaluru (Kanakapura / Banashankari)</option>
              <option value="Harohalli">Harohalli (Campus Loop & Town Stand)</option>
            </select>

            <label>College Shuttle</label>
            <select
              value={selectedBusId}
              onChange={e => setSelectedBusId(Number(e.target.value))}
              required
            >
              <option value="">Select an available bus</option>
              {availableBuses.map(bus => {
                const total = bus.bookedSeats + bus.walkInPassengers;
                const free = Math.max(0, bus.capacity - total);
                return (
                  <option key={bus.id} value={bus.id}>
                    {bus.number} · {free}/{bus.capacity} seats free · {bus.bayNumber} · {bus.status}
                  </option>
                );
              })}
            </select>

            <label>Travel Purpose</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setTravelType('NORMAL')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  travelType === 'NORMAL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white/80 text-slate-700 border-slate-200'
                }`}
              >
                Standard Commute
              </button>
              <button
                type="button"
                onClick={() => setTravelType('EMERGENCY')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  travelType === 'EMERGENCY'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white/80 text-slate-700 border-slate-200'
                }`}
              >
                Urgent Return
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full mt-6 py-3"
            >
              {submitting ? 'Reserving...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>

        {/* Existing Reservations */}
        <div className="card">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight pb-3 border-b border-white/40 mb-4">
            Your Active Bookings
          </h3>

          {studentBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Bus size={32} className="mx-auto mb-2 text-slate-400 opacity-60" />
              <p>No active reservations on file.</p>
              <p className="text-xs text-slate-400 mt-1">Select a bus on the left to claim your seat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentBookings.map(bk => (
                <div
                  key={bk.id}
                  className="p-4 rounded-2xl bg-white/85 border border-white shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm bg-blue-600 text-white px-2 py-0.5 rounded">
                          {bk.busNumber}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">To {bk.destination}</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Seat #{bk.seatNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1.5">
                        Boarding Bay: <b>{bk.bayNumber}</b>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pass Code: <b className="font-mono text-slate-600">{bk.id}</b> · {bk.bookingTime}
                      </div>
                    </div>

                    {bk.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => cancelBooking(bk.id)}
                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
