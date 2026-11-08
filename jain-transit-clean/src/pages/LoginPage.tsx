import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { ArrowLeft, Sparkles, KeyRound, Mail, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, signInWithGoogle } = useTransit();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user.role === 'STUDENT') onNavigate('/student');
      else if (user.role === 'DRIVER') onNavigate('/driver');
      else if (user.role === 'ADMIN') onNavigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'STUDENT') onNavigate('/student');
      else if (user.role === 'DRIVER') onNavigate('/driver');
      else if (user.role === 'ADMIN') onNavigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSeed = (seedEmail: string) => {
    setEmail(seedEmail);
    setPassword('Transit@123');
  };

  return (
    <div className="auth-wrap">
      {/* Visual side */}
      <div className="auth-visual">
        <div
          className="brand cursor-pointer"
          style={{ position: 'absolute', top: 32, left: 40, color: '#fff' }}
          onClick={() => onNavigate('/')}
        >
          JAIN <span style={{ color: '#93c5fd' }}>TRANSIT</span>
        </div>

        <div>
          <div className="kicker" style={{ color: '#fdba74' }}>Role-Based Campus Portal</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, margin: '8px 0 16px', lineHeight: 1.15 }}>
            Smarter journeys. Faster departures.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 440, fontSize: 15, lineHeight: 1.6 }}>
            Track university shuttles along Kanakapura corridor, view in-cab driver stop progression, check live seat fullness, and access emergency dispatch services.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <div className="auth-card">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4 bg-transparent border-0 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to homepage
          </button>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight" style={{ margin: 0 }}>
            Sign in
          </h2>
          <p className="muted" style={{ margin: '4px 0 18px', fontSize: 13 }}>
            Sign in with your Google account or select a demo role.
          </p>

          {/* Primary Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 mb-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all hover:shadow active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
              or demo accounts
            </span>
          </div>

          {/* Quick Demo Account Shortcuts */}
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 mb-5">
            <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-blue-600" />
              <span>Tap to autofill demo credentials:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSeed('student@jaintransit.edu')}
                className="py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickSeed('driver1@jaintransit.edu')}
                className="py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs"
              >
                Driver (JT-01)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSeed('admin@jaintransit.edu')}
                className="py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs"
              >
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>Campus Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. student@jaintransit.edu"
                required
              />
            </div>

            <label>Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Transit@123"
                required
              />
            </div>

            {error && (
              <div className="error flex items-center gap-1.5 bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-5 py-3"
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center mt-5 text-xs text-slate-500">
            Need student registration?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
