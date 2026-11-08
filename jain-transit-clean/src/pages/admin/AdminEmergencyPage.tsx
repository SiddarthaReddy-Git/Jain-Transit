import React from 'react';
import { useTransit } from '../../context/TransitContext';
import { ShieldAlert, CheckCircle2, Clock, MapPin, Bus, AlertOctagon } from 'lucide-react';

export const AdminEmergencyPage: React.FC = () => {
  const { emergencies, buses, adminTriageEmergency } = useTransit();

  const handleAction = async (id: string, action: 'ACKNOWLEDGE' | 'ASSIGN' | 'START' | 'COMPLETE' | 'CANCEL', busId?: number) => {
    await adminTriageEmergency(id, action, busId);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Triage Desk</div>
          <h2>Emergency Transport Requests ({emergencies.length})</h2>
        </div>
      </div>

      <div className="card mb-6">
        <p className="text-xs text-slate-600 font-medium">
          Review emergency requests from stranded or injured students. Assign an active campus shuttle only after reviewing capacity and location.
        </p>
      </div>

      <div className="space-y-4">
        {emergencies.map(req => {
          let statusTone = 'badge-warn';
          if (req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS') statusTone = 'badge-info';
          if (req.status === 'COMPLETED') statusTone = 'badge-ok';
          if (req.status === 'CANCELLED') statusTone = 'badge-city';

          return (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm bg-slate-900 text-white px-2 py-0.5 rounded">
                      #{req.id}
                    </span>
                    <strong className="text-slate-900 text-base">{req.studentName} → {req.destination}</strong>
                    <span className={`badge ${statusTone}`}>{req.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Logged: {req.createdAt} {req.latitude && `· GPS: (${req.latitude.toFixed(3)}, ${req.longitude?.toFixed(3)})`}
                  </div>
                </div>

                {req.assignedBusNumber && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                    Allocated: {req.assignedBusNumber}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700 bg-white/70 p-3 rounded-xl border border-white my-3">
                {req.reason || 'No detailed reason specified.'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/40">
                {req.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleAction(req.id, 'ACKNOWLEDGE')}
                    className="chip bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Acknowledge
                  </button>
                )}

                {['PENDING', 'ACKNOWLEDGED'].includes(req.status) &&
                  buses.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleAction(req.id, 'ASSIGN', b.id)}
                      className="chip bg-slate-900 text-white border-slate-900"
                    >
                      Assign {b.number}
                    </button>
                  ))}

                {req.status === 'ASSIGNED' && (
                  <button
                    type="button"
                    onClick={() => handleAction(req.id, 'START')}
                    className="chip bg-indigo-600 text-white border-indigo-600"
                  >
                    Mark In Progress
                  </button>
                )}

                {['ASSIGNED', 'IN_PROGRESS'].includes(req.status) && (
                  <button
                    type="button"
                    onClick={() => handleAction(req.id, 'COMPLETE')}
                    className="chip bg-emerald-600 text-white border-emerald-600"
                  >
                    Complete
                  </button>
                )}

                {!['COMPLETED', 'CANCELLED'].includes(req.status) && (
                  <button
                    type="button"
                    onClick={() => handleAction(req.id, 'CANCEL')}
                    className="chip bg-rose-50 text-rose-700 border-rose-200"
                  >
                    Cancel
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
