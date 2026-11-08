import React from 'react';
import { useTransit } from '../../context/TransitContext';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

export const AdminBookingsPage: React.FC = () => {
  const { bookings, adminCancelBooking } = useTransit();

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Manifest & Reservations</div>
          <h2>Student Seat Bookings ({bookings.length})</h2>
        </div>
      </div>

      <div className="card">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No student bookings on file today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Pass ID</th>
                  <th>Student</th>
                  <th>Bus #</th>
                  <th>Seat #</th>
                  <th>Destination</th>
                  <th>Bay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(bk => (
                  <tr key={bk.id}>
                    <td className="font-mono text-xs font-bold text-slate-700">{bk.id}</td>
                    <td className="font-bold text-slate-900 text-xs">{bk.studentName}</td>
                    <td className="font-mono font-bold text-slate-800">{bk.busNumber}</td>
                    <td>
                      <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        #{bk.seatNumber}
                      </span>
                    </td>
                    <td className="text-xs font-semibold text-slate-800">{bk.destination}</td>
                    <td className="text-xs text-slate-500">{bk.bayNumber}</td>
                    <td>
                      <span
                        className={`badge ${
                          bk.status === 'CONFIRMED' ? 'badge-ok' : 'badge-city'
                        }`}
                      >
                        {bk.status}
                      </span>
                    </td>
                    <td>
                      {bk.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => adminCancelBooking(bk.id)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
