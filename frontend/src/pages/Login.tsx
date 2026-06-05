import React, { useState, useEffect } from 'react';
import {
  Activity, Mail, AlertCircle, Lock,
  ArrowRight, Cookie,
} from 'lucide-react';
import { authService } from '../services/auth.service';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

// ── Cookie helpers ──────────────────────────────────────────────────────────────
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
};
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
};

const saveSession = (token: string, user: any, remember: boolean) => {
  if (remember) {
    setCookie('nila_token', token, 30);
    setCookie('nila_user', JSON.stringify(user), 30);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
  } else {
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    deleteCookie('nila_token');
    deleteCookie('nila_user');
  }
};

// ── Shared styles ───────────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white ' +
  'placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ' +
  'focus:border-cyan-500/60 transition-all duration-200 text-sm';
const primaryBtn =
  'w-full py-3.5 font-semibold rounded-xl transition-all duration-200 ' +
  'flex items-center justify-center gap-2 text-sm ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

// ─────────────────────────────────────────────────────────────────────────────
//  Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="flex items-center gap-3 rounded-xl p-3.5 mb-1 text-sm"
    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
  >
    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
    <span className="text-red-400">{message}</span>
  </div>
);

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const RememberMeToggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <div className="flex items-center justify-between">
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      <div className="relative">
        <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only" />
        <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          value ? 'border-cyan-500 bg-cyan-500/20' : 'border-white/20 bg-white/5 group-hover:border-white/40'
        }`}>
          {value && (
            <svg className="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Cookie className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" />
        <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
          Remember me for 30 days
        </span>
      </div>
    </label>
    {value && <span className="text-[10px] text-cyan-500/70 font-medium tracking-wide">Cookie saved</span>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [rememberMe, setRememberMe] = useState(() => getCookie('nila_remember') === '1');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    rememberMe ? setCookie('nila_remember', '1', 30) : deleteCookie('nila_remember');
  }, [rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.adminLogin(email.trim(), password);
      if (res.success) {
        saveSession(res.data.accessToken, res.data.user, rememberMe);
        onLogin(res.data.accessToken, res.data.user);
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)' }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/4 rounded-full blur-3xl" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-20"
           style={{
             backgroundImage: `linear-gradient(rgba(99,179,237,0.08) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(99,179,237,0.08) 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
           }} />

      <div className="relative w-full max-w-[440px]">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-2xl blur-xl" />
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
            >
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nila Healthcare</h1>
          <p className="text-white/40 mt-1 text-sm">Secure Access Portal</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="p-6 pt-6">
            {/* Section heading */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">Admin Sign In</h2>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="h-px flex-1"
                     style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.4), transparent)' }} />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <ErrorBanner message={error} />}

              <div>
                <p className="text-xs text-white/35 mb-6">
                  Sign in with your admin credentials to access the management portal.
                </p>

                {/* Email */}
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative mb-4">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@nilahealthcare.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>

                {/* Password */}
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-xs font-medium"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <RememberMeToggle value={rememberMe} onChange={setRememberMe} />

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={primaryBtn}
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 20px rgba(6,182,212,0.4)' }}
              >
                {loading
                  ? <><Spinner />Signing in...</>
                  : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            {/* Cookie info */}
            <div
              className="mt-5 rounded-xl p-3 flex items-start gap-2.5"
              style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}
            >
              <Cookie className="w-3.5 h-3.5 text-cyan-500/50 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/25 leading-relaxed">
                Admin sessions are secured with role-based access control. Contact your system administrator if you need access.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-white/25 text-center leading-relaxed">
                Admin & Expert access only. Unauthorised access is prohibited.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2025 Nila Healthcare · Secure Portal</p>
      </div>
    </div>
  );
};

export default Login; 