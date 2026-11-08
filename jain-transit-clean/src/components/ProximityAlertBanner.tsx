import React from 'react';
import { BayAnnouncement } from '../types/transit';
import { Bell, Volume2, X, Clock, MapPin } from 'lucide-react';

interface ProximityAlertBannerProps {
  announcement: BayAnnouncement | null;
  onDismiss: () => void;
  onPlayChime: () => void;
}

export const ProximityAlertBanner: React.FC<ProximityAlertBannerProps> = ({
  announcement,
  onDismiss,
  onPlayChime,
}) => {
  if (!announcement) return null;

  const isBoarding = announcement.severity === 'BOARDING';
  const toneBg = isBoarding
    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white'
    : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white';

  return (
    <div className={`rounded-2xl p-4 shadow-xl border border-white/20 mb-6 ${toneBg} transition-all duration-300 animate-[riseIn_0.35s_ease]`}>
      <div className="flex items-start md:items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Bell size={20} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-md">
                {isBoarding ? 'Boarding Gate Open' : 'Shuttle Approach Alert'}
              </span>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock size={12} />
                {announcement.etaMinutes === 0 ? 'Now at Stop' : `ETA: ~${announcement.etaMinutes} mins`}
              </span>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <MapPin size={12} />
                {announcement.bayNumber}
              </span>
            </div>
            <p className="font-bold text-sm md:text-base mt-1 text-white/95">
              {announcement.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={onPlayChime}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Replay station chime"
          >
            <Volume2 size={14} />
            <span>Chime</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
            title="Dismiss announcement"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
