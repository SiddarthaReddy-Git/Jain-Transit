import React from 'react';
import { useTransit } from '../context/TransitContext';
import { LiveCampusMap } from '../components/LiveCampusMap';
import { BayDepartureBoard } from '../components/BayDepartureBoard';
import { ArrowRight, Bus, ShieldAlert, Sparkles, MapPin, Users, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { buses, login, soundEnabled, setSoundEnabled, playChimeManually } = useTransit();

  const handleQuickLogin = async (email: string) => {
    const user = await login(email, 'Transit@123');
    if (user.role === 'STUDENT') onNavigate('/student');
    else if (user.role === 'DRIVER') onNavigate('/driver');
    else if (user.role === 'ADMIN') onNavigate('/admin');
  };

  return (
    <div className="landing">
      {/* Top Navigation */}
      <header className="shell topbar">
        <div className="brand cursor-pointer" onClick={() => onNavigate('/')}>
          JAIN <span>TRANSIT</span>
          <small>Smarter journeys. Faster departures.</small>
        </div>
        <nav className="nav">
          <a href="#departures">Departures</a>
          <a href="#tracking">Live Map</a>
          <a href="#emergency">Emergency SOS</a>
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="text-slate-700 font-bold hover:text-blue-600 bg-transparent border-0 cursor-pointer text-sm"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/register')}
            className="btn btn-primary"
          >
            Hop in
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="shell hero">
        <div className="reveal">
          <div className="kicker">Campus rides, minus the guesswork</div>
          <h1>Catch the next shuttle like a local.</h1>
          <p className="lede">Smarter journeys. Faster departures.</p>
          <p className="lede">
            See college buses moving along Kanakapura road toward Harohalli and Bengaluru, track in-cab stop checklists and live seat occupancy, or ping the emergency desk if you need immediate campus dispatch.
          </p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="btn btn-primary"
            >
              <span>Find a departure</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="btn btn-ghost"
            >
              Driver / Admin Login
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 p-3.5 rounded-2xl bg-white/70 border border-white/80 backdrop-blur-md shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>One-Click Instant Demo Portals:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@jaintransit.edu')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                Student Demo (Aarav)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('driver1@jaintransit.edu')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                Driver Demo (JT-01 Cab)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@jaintransit.edu')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                Admin Control Center
              </button>
            </div>
          </div>

          {/* Live Ticker */}
          <div className="ticker">
            <div className="ticker-track">
              <span>● JT-01 approaching Kanakapura Cross</span>
              <span>● JT-02 boarding at Bay 1</span>
              <span>● Driver in-cab stop checklists and live seat meters active</span>
              <span>● Emergency transport desk standing by</span>
              <span>● City buses (BMTC 211-C) on schedule</span>
            </div>
          </div>
        </div>

        {/* Live Mini Preview */}
        <div>
          <LiveCampusMap buses={buses} compact={true} onSelectBus={() => onNavigate('/login')} />
        </div>
      </section>

      {/* Live Campus Departures Section */}
      <section id="departures" className="shell" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <BayDepartureBoard
          buses={buses}
          onSelectBus={() => onNavigate('/register')}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onPlayChime={playChimeManually}
        />
      </section>

      {/* Full Map Section */}
      <section id="tracking" className="shell" style={{ paddingBottom: 64 }}>
        <div className="page-head">
          <div>
            <div className="kicker">Real-time GPS & Timetable</div>
            <h2>Corridor Map View</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/student')}
            className="btn btn-ghost text-xs"
          >
            Open in Student Portal
          </button>
        </div>
        <LiveCampusMap buses={buses} onSelectBus={() => onNavigate('/login')} />
      </section>

      {/* Emergency Feature Card */}
      <section id="emergency" className="shell" style={{ paddingBottom: 72 }}>
        <div className="emergency-banner">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={22} className="text-white" />
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                Campus SOS Dispatch
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white" style={{ margin: '8px 0' }}>
              Late night or medical transit emergency?
            </h2>
            <p className="text-rose-100 text-sm md:text-base max-w-xl">
              Alert the transport desk immediately with your live campus coordinates. Supervisors allocate an emergency vehicle on priority.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              handleQuickLogin('student@jaintransit.edu');
              onNavigate('/student/emergency');
            }}
            className="btn bg-white text-rose-600 font-extrabold hover:bg-rose-50 shadow-lg shrink-0"
          >
            Request Emergency Shuttle
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="shell footer">
        <div>© 2026 Jain Transit · Jain University Campus Transport System</div>
        <div>Smarter journeys. Faster departures.</div>
      </footer>
    </div>
  );
};
