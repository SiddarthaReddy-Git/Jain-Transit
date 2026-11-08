import React, { useState, useMemo } from 'react';
import { useTransit } from '../../context/TransitContext';
import { BayDepartureBoard } from '../../components/BayDepartureBoard';
import { ProximityAlertBanner } from '../../components/ProximityAlertBanner';
import {
  ArrowRight,
  Bus,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  X,
  Radio,
} from 'lucide-react';

interface StudentLoungeProps {
  onNavigate: (path: string) => void;
}

export const StudentLounge: React.FC<StudentLoungeProps> = ({ onNavigate }) => {
  const {
    currentUser,
    buses,
    cityBuses,
    bookings,
    cancelBooking,
    activeAnnouncement,
    soundEnabled,
    setSoundEnabled,
    playChimeManually,
  } = useTransit();

  const [destination, setDestination] = useState<string>('Bengaluru');
  const [travelType, setTravelType] = useState<'NORMAL' | 'EMERGENCY'>('NORMAL');
  const [dismissedAlert, setDismissedAlert] = useState<boolean>(false);
  const [operatorFilter, setOperatorFilter] = useState<'ALL' | 'BMTC' | 'KSRTC'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'>('ALL');
  const [cityBusSearch, setCityBusSearch] = useState<string>('');
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);

  const studentBookings = bookings.filter(b => b.studentId === currentUser?.id);

  // Filter college shuttles matching selected destination
  const matchedShuttles = buses.filter(b =>
    b.destination.toLowerCase() === destination.toLowerCase()
  );

  // Time conversion utility to calculate minutes from midnight
  const getMinutesFromMidnight = (timeStr?: string) => {
    if (!timeStr) return 0;
    if (timeStr.includes(':')) {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    } else if (timeStr.length === 4) {
      const hours = parseInt(timeStr.slice(0, 2), 10);
      const minutes = parseInt(timeStr.slice(2, 4), 10);
      return hours * 60 + minutes;
    }
    return 0;
  };

  // Find next upcoming departure based on current client time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sortedCityBuses = useMemo(() => {
    return [...cityBuses].sort((a, b) => {
      const timeA = getMinutesFromMidnight(a.departureTimeRaw || a.departureTime);
      const timeB = getMinutesFromMidnight(b.departureTimeRaw || b.departureTime);
      return timeA - timeB;
    });
  }, [cityBuses]);

  const nextDepartureBus = useMemo(() => {
    const upcoming = sortedCityBuses.find(
      b => getMinutesFromMidnight(b.departureTimeRaw || b.departureTime) >= currentMinutes
    );
    return upcoming || sortedCityBuses[0];
  }, [sortedCityBuses, currentMinutes]);

  // Filter city buses based on operator, time period, destination, and search query
  const filteredCityBuses = useMemo(() => {
    return sortedCityBuses.filter(cb => {
      // Operator filter
      if (operatorFilter !== 'ALL' && cb.operator !== operatorFilter) {
        return false;
      }

      // Period filter
      const mins = getMinutesFromMidnight(cb.departureTimeRaw || cb.departureTime);
      if (periodFilter === 'MORNING' && mins >= 720) return false; // before 12:00 PM
      if (periodFilter === 'AFTERNOON' && (mins < 720 || mins >= 990)) return false; // 12:00 PM to 4:30 PM
      if (periodFilter === 'EVENING' && mins < 990) return false; // after 4:30 PM

      // Search keyword filter
      if (cityBusSearch.trim()) {
        const query = cityBusSearch.toLowerCase();
        const matchesRoute = cb.routeNumber.toLowerCase().includes(query);
        const matchesDest = cb.destination.toLowerCase().includes(query);
        const matchesVia = cb.via.toLowerCase().includes(query);
        const matchesTime = cb.departureTime.toLowerCase().includes(query) || (cb.departureTimeRaw && cb.departureTimeRaw.includes(query));
        if (!matchesRoute && !matchesDest && !matchesVia && !matchesTime) {
          return false;
        }
      }

      return true;
    });
  }, [sortedCityBuses, operatorFilter, periodFilter, cityBusSearch]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="kicker">Student Lounge · Welcome {currentUser?.fullName}</div>
          <h2>Where to today?</h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/student/emergency')}
          className="btn btn-danger"
        >
          <ShieldAlert size={16} />
          <span>Emergency Transport</span>
        </button>
      </div>

      {/* Destination & Travel Type Filter Chips */}
      <div className="chips">
        <button
          type="button"
          onClick={() => setDestination('Bengaluru')}
          className={`chip ${destination === 'Bengaluru' ? 'on' : ''}`}
        >
          Bengaluru
        </button>
        <button
          type="button"
          onClick={() => setDestination('Harohalli')}
          className={`chip ${destination === 'Harohalli' ? 'on' : ''}`}
        >
          Harohalli
        </button>
        <button
          type="button"
          onClick={() => setTravelType('NORMAL')}
          className={`chip ${travelType === 'NORMAL' ? 'on' : ''}`}
        >
          Normal Commute
        </button>
        <button
          type="button"
          onClick={() => {
            setTravelType('EMERGENCY');
            onNavigate('/student/emergency');
          }}
          className={`chip emergency ${travelType === 'EMERGENCY' ? 'on' : ''}`}
        >
          Emergency Travel
        </button>
      </div>

      {/* Proximity Alert Banner */}
      {!dismissedAlert && activeAnnouncement && (
        <ProximityAlertBanner
          announcement={activeAnnouncement}
          onDismiss={() => setDismissedAlert(true)}
          onPlayChime={playChimeManually}
        />
      )}

      {/* Live Campus Bay Departure Board */}
      <BayDepartureBoard
        buses={buses}
        onSelectBus={busId => onNavigate(`/student/book?busId=${busId}&dest=${destination}`)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onPlayChime={playChimeManually}
      />

      {/* Active Student Bookings */}
      {studentBookings.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/40 mb-3">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Your Confirmed Reservations ({studentBookings.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Boarding Pass Ready</span>
          </div>

          <div className="space-y-3">
            {studentBookings.map(bk => (
              <div
                key={bk.id}
                className="p-3.5 rounded-2xl bg-white/80 border border-white shadow-sm flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm bg-slate-900 text-white px-2 py-0.5 rounded">
                      {bk.busNumber}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">To {bk.destination}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Seat #{bk.seatNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Boarding: <b>{bk.bayNumber}</b> · Booked: {bk.bookingTime}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Pass: {bk.id}</span>
                  {bk.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => cancelBooking(bk.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      Cancel Seat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended College Shuttles */}
      <div className="card mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/40 mb-4">
          <div>
            <div className="kicker" style={{ margin: 0 }}>Direct Campus Fleet</div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight" style={{ margin: 0 }}>
              Shuttles to {destination}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/student/map')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View all on live map</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="bus-list">
          {matchedShuttles.map(bus => {
            const totalOccupied = bus.bookedSeats + bus.walkInPassengers;
            const available = Math.max(0, bus.capacity - totalOccupied);
            const isFull = available === 0;

            return (
              <div key={bus.id} className="bus-row">
                <div>
                  <div className="bus-num">{bus.number}</div>
                  <span className={`badge ${bus.isSimulated ? 'badge-sim' : 'badge-live'}`}>
                    {bus.isSimulated ? 'Simulated' : 'Live Driver'}
                  </span>
                </div>

                <div>
                  <div className="font-extrabold text-slate-800 text-base">{bus.routeName}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Driver: <b>{bus.driverName}</b></span>
                    <span>·</span>
                    <span>Bay: <b>{bus.bayNumber}</b></span>
                    <span>·</span>
                    <span>Departs: <b>{bus.departureTime}</b></span>
                  </div>

                  {/* Occupancy Indicator */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isFull ? 'bg-red-500' : available < 6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, Math.round((totalOccupied / bus.capacity) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {available} seats free ({totalOccupied}/{bus.capacity})
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={isFull}
                    onClick={() => onNavigate(`/student/book?busId=${bus.id}&dest=${destination}`)}
                    className={`btn text-xs ${isFull ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'btn-primary'}`}
                  >
                    {isFull ? 'Full' : 'Reserve Seat'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled City Buses (BMTC / KSRTC) - Jain University Gate Departures */}
      <div className="card">
        {/* Card Header with Gate Notice badge */}
        <div className="pb-4 border-b border-white/40 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                Official Gate Timetable
              </span>
              <span className="text-xs text-slate-500">14 Daily Departures</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Bus size={20} className="text-blue-600" />
              <span>Jain University Gate Departure Timings (BMTC / KSRTC)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Official departure slots from Jain University Gate along the Kanakapura highway corridor (NH-948 / Harohalli road).
            </p>
          </div>

          {/* Action button to view original notice attachment */}
          <button
            type="button"
            onClick={() => setShowNoticeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-300 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <ImageIcon size={14} className="text-blue-600" />
            <span>View Gate Timetable Sheet</span>
          </button>
        </div>

        {/* Next Departure Highlight Card */}
        {nextDepartureBus && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md mb-5 border border-blue-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                  <Radio size={20} className="animate-pulse text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      Next Gate Departure
                    </span>
                    <span className="text-xs text-blue-200">Scheduled Daily</span>
                  </div>
                  <div className="text-lg font-black mt-1 flex items-center gap-2">
                    <span>{nextDepartureBus.departureTime}</span>
                    {nextDepartureBus.departureTimeRaw && (
                      <span className="font-mono text-xs text-blue-300 font-normal">
                        ({nextDepartureBus.departureTimeRaw} hrs)
                      </span>
                    )}
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="text-amber-300 font-extrabold">{nextDepartureBus.routeNumber}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    To <b>{nextDepartureBus.destination}</b> via {nextDepartureBus.via}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                  {nextDepartureBus.operator}
                </span>
                <span className="text-xs text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                  Gate Stop Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* Operator & Period Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter size={13} />
              <span>Operator:</span>
            </span>
            <button
              type="button"
              onClick={() => setOperatorFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                operatorFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200'
              }`}
            >
              All (14)
            </button>
            <button
              type="button"
              onClick={() => setOperatorFilter('BMTC')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                operatorFilter === 'BMTC'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white/70 text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              BMTC (12)
            </button>
            <button
              type="button"
              onClick={() => setOperatorFilter('KSRTC')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                operatorFilter === 'KSRTC'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white/70 text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              KSRTC (2)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={cityBusSearch}
              onChange={e => setCityBusSearch(e.target.value)}
              placeholder="Search route, time, stop…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/80 border border-slate-200 focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
            {cityBusSearch && (
              <button
                type="button"
                onClick={() => setCityBusSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto rounded-xl border border-white/60 bg-white/40 shadow-xs">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700">
                <th className="py-2.5 px-3 text-left">Gate Departure</th>
                <th className="py-2.5 px-3 text-left">Route #</th>
                <th className="py-2.5 px-3 text-left">Operator</th>
                <th className="py-2.5 px-3 text-left">Destination</th>
                <th className="py-2.5 px-3 text-left">Corridor Stops / Via</th>
                <th className="py-2.5 px-3 text-right">Timing Code</th>
              </tr>
            </thead>
            <tbody>
              {filteredCityBuses.map(cb => {
                const isNext = nextDepartureBus?.id === cb.id;
                const departureMins = getMinutesFromMidnight(cb.departureTimeRaw || cb.departureTime);
                const hasDeparted = departureMins < currentMinutes;

                return (
                  <tr
                    key={cb.id}
                    className={`border-b border-slate-200/60 transition-colors ${
                      isNext
                        ? 'bg-blue-50/90 font-bold border-l-4 border-l-blue-600'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    {/* Departure Time */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={isNext ? 'text-blue-600' : 'text-slate-400'} />
                        <div>
                          <span className={`text-sm font-bold ${isNext ? 'text-blue-900' : 'text-slate-800'}`}>
                            {cb.departureTime}
                          </span>
                          {isNext && (
                            <span className="block text-[10px] text-emerald-600 font-extrabold uppercase">
                              ● Upcoming next
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Route # */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded shadow-xs">
                        {cb.routeNumber}
                      </span>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          cb.operator === 'BMTC'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {cb.operator}
                      </span>
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-3 font-semibold text-slate-800 text-xs">
                      {cb.destination}
                    </td>

                    {/* Key Via Stops */}
                    <td className="py-3 px-3 text-xs text-slate-600 max-w-xs">
                      {cb.via}
                    </td>

                    {/* Raw Timing Code from attachment */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-black text-xs text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                        {cb.departureTimeRaw || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredCityBuses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                    No scheduled gate departures match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-white/40 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
          <span>
            <b>Boarding Location:</b> Jain University Main Highway Gate (Kanakapura Road / NH-948)
          </span>
          <span className="font-mono text-slate-400">
            Source: Official Jain University Gate Departure Notice
          </span>
        </div>
      </div>

      {/* Modal to view official sheet attachment */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNoticeModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Official Gate Timetable Notice
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Departure timings for city buses operating directly from Jain University Gate:
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2 max-h-[500px]">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-08_at_6.00.53_PM_91fe9fb3.jpeg"
                alt="Jain University Gate Departure Timings"
                className="max-h-[460px] w-auto object-contain rounded-xl shadow-sm"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="btn btn-primary text-xs py-2 px-4"
              >
                Close Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
