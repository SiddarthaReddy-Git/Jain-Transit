import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useTransit();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ email, pass: password, fullName, phone });
      onNavigate('/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-visual">
        <div
          className="brand cursor-pointer"
          style={{ position: 'absolute', top: 32, left: 40, color: '#fff' }}
          onClick={() => onNavigate('/')}
        >
          JAIN <span style={{ color: '#93c5fd' }}>TRANSIT</span>
        </div>

        <div>
          <div className="kicker" style={{ color: '#fdba74' }}>Student Access</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, margin: '8px 0 16px', lineHeight: 1.15 }}>
            Book a seat before the bay fills.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 440, fontSize: 15, lineHeight: 1.6 }}>
            Register once, then track college shuttles in real time, monitor bay departures, and reserve a guaranteed seat.
          </p>
        </div>
      </div>

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
            Student registration
          </h2>
          <p className="muted" style={{ margin: '4px 0 18px', fontSize: 13 }}>
            Create your campus rider account.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              required
            />

            <label>Campus Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. aarav@jaintransit.edu"
              required
            />

            <label>Phone Number (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98450 00000"
            />

            <label>Password (min 6 characters)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              minLength={6}
              required
            />

            {error && <div className="error">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-5 py-3"
            >
              {loading ? 'Creating account...' : 'Create student account'}
            </button>
          </form>

          <div className="text-center mt-5 text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
