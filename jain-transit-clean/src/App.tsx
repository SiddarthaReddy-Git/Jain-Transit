import React, { useState, useEffect } from 'react';
import { TransitProvider, useTransit } from './context/TransitContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentLounge } from './pages/student/StudentLounge';
import { StudentBookPage } from './pages/student/StudentBookPage';
import { StudentEmergencyPage } from './pages/student/StudentEmergencyPage';
import { LiveCampusMap } from './components/LiveCampusMap';
import { DriverConsolePage } from './pages/driver/DriverConsolePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminFleetPage } from './pages/admin/AdminFleetPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminEmergencyPage } from './pages/admin/AdminEmergencyPage';
import { TransitChatbot } from './components/TransitChatbot';
import { Home, Map, BookOpen, ShieldAlert, LogOut, Bus, Users, ClipboardList, LayoutDashboard } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, logout, buses } = useTransit();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Read from window.location.hash or pathname
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  });

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse path and params
  const [basePath, searchParams] = currentPath.split('?');
  const params = new URLSearchParams(searchParams || '');
  const busIdParam = params.get('busId') ? Number(params.get('busId')) : undefined;
  const destParam = params.get('dest') || undefined;

  // Render Public / Unauthenticated pages
  if (basePath === '/' || basePath === '') {
    return <LandingPage onNavigate={navigate} />;
  }

  if (basePath === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }

  if (basePath === '/register') {
    return <RegisterPage onNavigate={navigate} />;
  }

  // Ensure user is signed in for role-based sections
  if (!currentUser) {
    return <LoginPage onNavigate={navigate} />;
  }

  // Student Section
  if (basePath.startsWith('/student')) {
    return (
      <div className="app-frame">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand cursor-pointer" onClick={() => navigate('/')}>
            JAIN <span>TRANSIT</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/student')}
            className={`link ${basePath === '/student' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Student Lounge</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/map')}
            className={`link ${basePath === '/student/map' ? 'active' : ''}`}
          >
            <Map size={18} />
            <span>Live Campus Map</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/book')}
            className={`link ${basePath === '/student/book' ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Book Seat</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/emergency')}
            className={`link ${basePath === '/student/emergency' ? 'active text-rose-300' : ''}`}
          >
            <ShieldAlert size={18} />
            <span>Emergency SOS</span>
          </button>

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="px-3 py-2 text-xs text-slate-400">
              Signed in as <b className="text-white block truncate">{currentUser.fullName}</b>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Student Rider</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="link w-full text-rose-300 hover:text-rose-200"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main">
          {basePath === '/student' && <StudentLounge onNavigate={navigate} />}
          {basePath === '/student/map' && (
            <div>
              <div className="page-head">
                <div>
                  <div className="kicker">Real-time GPS Telemetry</div>
                  <h2>Live Campus & Corridor Map</h2>
                </div>
              </div>
              <LiveCampusMap buses={buses} />
            </div>
          )}
          {basePath === '/student/book' && (
            <StudentBookPage
              onNavigate={navigate}
              initialBusId={busIdParam}
              initialDest={destParam}
            />
          )}
          {basePath === '/student/emergency' && <StudentEmergencyPage onNavigate={navigate} />}
        </main>
      </div>
    );
  }

  // Driver Section
  if (basePath.startsWith('/driver')) {
    return (
      <div className="min-h-screen pb-12">
        <header className="shell flex items-center justify-between py-4 border-b border-white/20">
          <div className="brand cursor-pointer" onClick={() => navigate('/')}>
            JAIN <span>TRANSIT</span>
            <small>Driver Terminal</small>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/70 hover:bg-white border border-white"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </header>

        <DriverConsolePage onNavigate={navigate} />
      </div>
    );
  }

  // Admin Section
  if (basePath.startsWith('/admin')) {
    return (
      <div className="app-frame">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand cursor-pointer" onClick={() => navigate('/')}>
            JAIN <span>TRANSIT</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className={`link ${basePath === '/admin' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Control Center</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/fleet')}
            className={`link ${basePath === '/admin/fleet' ? 'active' : ''}`}
          >
            <Bus size={18} />
            <span>Fleet & Bays</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/bookings')}
            className={`link ${basePath === '/admin/bookings' ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            <span>Bookings Manifest</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/emergency')}
            className={`link ${basePath === '/admin/emergency' ? 'active text-rose-300' : ''}`}
          >
            <ShieldAlert size={18} />
            <span>Emergency Triage</span>
          </button>

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="px-3 py-2 text-xs text-slate-400">
              Logged in as <b className="text-white block truncate">{currentUser.fullName}</b>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Transport Admin</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="link w-full text-rose-300 hover:text-rose-200"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main">
          {basePath === '/admin' && <AdminDashboard onNavigate={navigate} />}
          {basePath === '/admin/fleet' && <AdminFleetPage />}
          {basePath === '/admin/bookings' && <AdminBookingsPage />}
          {basePath === '/admin/emergency' && <AdminEmergencyPage />}
        </main>
      </div>
    );
  }

  // Fallback redirect to homepage
  return <LandingPage onNavigate={navigate} />;
};

export default function App() {
  return (
    <TransitProvider>
      <AppContent />
      <TransitChatbot />
    </TransitProvider>
  );
}
