import React, { useState } from 'react';
import { useTransit } from '../../context/TransitContext';
import { ArrowLeft, ShieldAlert, MapPin, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';

interface StudentEmergencyPageProps {
  onNavigate: (path: string) => void;
}

export const StudentEmergencyPage: React.FC<StudentEmergencyPageProps> = ({ onNavigate }) => {
  const { emergencies, createEmergencyRequest, currentUser } = useTransit();
  const [destination, setDestination] = useState('Bengaluru (Emergency)');
  const [reason, setReason] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<string>('Location not attached.');
  const [locating, setLocating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocStatus('Acquiring campus GPS fix...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus(`GPS Attached (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setLocating(false);
      },
      () => {
        // Fallback campus coordinate
        setCoords({ lat: 12.6521, lng: 77.4412 });
        setLocStatus('Campus Gate 1 default coordinates attached.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    setSubmitting(true);
    try {
      await createEmergencyRequest(destination, reason, coords?.lat, coords?.lng);
      setNotice('Emergency dispatch alert broadcast to the transport desk. A supervisor is reviewing your request.');
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  const myRequests = emergencies.filter(e => e.studentId === currentUser?.id || e.studentName === currentUser?.fullName);

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
          <h2>Emergency Transport (SOS)</h2>
        </div>
      </div>

      <div className="emergency-banner mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={22} className="text-white" />
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
              High Priority Dispatch Desk
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white" style={{ margin: '4px 0' }}>
            Direct Transport Supervisor Hotline
          </h2>
          <p className="text-rose-100 text-xs md:text-sm max-w-xl">
            This alerts the campus fleet desk immediately. Do not assume vehicle departure until your status changes to <b>ASSIGNED</b> or <b>IN PROGRESS</b>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SOS Request Form */}
        <div className="card">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight pb-3 border-b border-white/40 mb-4">
            Broadcast SOS Request
          </h3>

          {notice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-start gap-2 mb-4">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>Destination Hospital / Transit Center</label>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
            >
              <option value="Bengaluru (Fortis / Apollo Hospital Bannerghatta)">Bengaluru (Medical Clinic / Hospital)</option>
              <option value="Bengaluru (Banashankari Metro Hub)">Bengaluru (Metro Transit Connection)</option>
              <option value="Harohalli (Government Hospital & Town Center)">Harohalli (Local Clinic / Stand)</option>
              <option value="Bengaluru (Kempegowda Central Railway Station)">Bengaluru (Railway / Airport Shuttle)</option>
            </select>

            <label>Emergency Reason / Details</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe your situation (e.g. severe injury, urgent medical appointment, missed last scheduled city transit with no safe return options)..."
              required
            />

            <label>Your Live Campus Location</label>
            <div className="flex items-center gap-3 mt-1 p-3 rounded-2xl bg-white/80 border border-white">
              <button
                type="button"
                disabled={locating}
                onClick={handleGetLocation}
                className="btn btn-ghost text-xs py-2 px-3 shrink-0 flex items-center gap-1.5"
              >
                <MapPin size={14} className="text-rose-600" />
                <span>{locating ? 'Acquiring...' : 'Attach GPS Location'}</span>
              </button>
              <span className="text-xs text-slate-600 font-medium truncate">{locStatus}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-danger w-full mt-6 py-3 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              <span>{submitting ? 'Broadcasting...' : 'Broadcast Emergency Request'}</span>
            </button>
          </form>
        </div>

        {/* SOS Request History */}
        <div className="card">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight pb-3 border-b border-white/40 mb-4">
            Recent Emergency Requests
          </h3>

          {myRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Clock size={32} className="mx-auto mb-2 text-slate-400 opacity-60" />
              <p>No active emergency dispatch requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map(req => {
                let statusTone = 'bg-amber-100 text-amber-800';
                if (req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS') {
                  statusTone = 'bg-blue-100 text-blue-800';
                } else if (req.status === 'COMPLETED') {
                  statusTone = 'bg-emerald-100 text-emerald-800';
                }

                return (
                  <div key={req.id} className="p-4 rounded-2xl bg-white/85 border border-white shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                        #{req.id}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusTone}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-sm">{req.destination}</div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{req.reason}</p>

                    {req.assignedBusNumber && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs font-semibold text-blue-700">
                        Assigned Shuttle: <b>{req.assignedBusNumber}</b>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
