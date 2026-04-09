import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Lock, Mail, Eye, EyeOff, AlertCircle,
  ShieldCheck, ArrowRight, RotateCcw, User, Phone, Cookie,
} from 'lucide-react';
import { authService } from '../services/auth.service';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

type LoginMode = 'admin' | 'patient';
type OtpStep  = 'phone' | 'otp';

// ── Cookie helpers ─────────────────────────────────────────────────────────────
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

const saveSession = (token: string, user: any, remember: boolean) => {
  if (remember) {
    // Persist for 30 days via cookie
    setCookie('nila_token', token, 30);
    setCookie('nila_user', JSON.stringify(user), 30);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  } else {
    // Session only — localStorage cleared when tab closes via sessionStorage
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    deleteCookie('nila_token');
    deleteCookie('nila_user');
  }
  // Always keep localStorage copy for api.ts compatibility
  localStorage.setItem('accessToken', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode]                 = useState<LoginMode>('admin');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(() => getCookie('nila_remember') === '1');
  const [phone, setPhone]               = useState('');
  const [otpStep, setOtpStep]           = useState<OtpStep>('phone');
  const [otpDigits, setOtpDigits]       = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer]   = useState(0);
  const [devOtp, setDevOtp]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const inputRefs                       = useRef<(HTMLInputElement | null)[]>([]);

  // Restore remembered email on mount
  useEffect(() => {
    const savedEmail = getCookie('nila_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Persist remember-me preference
  useEffect(() => {
    if (rememberMe) {
      setCookie('nila_remember', '1', 30);
    } else {
      deleteCookie('nila_remember');
      deleteCookie('nila_email');
    }
  }, [rememberMe]);

  const switchMode = (m: LoginMode) => {
    setMode(m); setError(''); setEmail(''); setPassword('');
    setPhone(''); setOtpDigits(['','','','','','']);
    setOtpStep('phone'); setResendTimer(0); setDevOtp('');
  };

  // 2-minute resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otpStep === 'otp' && otpDigits.join('').length === 6 && !loading) {
      handleVerifyOtp();
    }
  }, [otpDigits]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Admin login ──────────────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authService.adminLogin(email, password);
      if (res.success) {
        if (rememberMe) setCookie('nila_email', email, 30);
        saveSession(res.data.accessToken, res.data.user, rememberMe);
        onLogin(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Send / resend OTP ────────────────────────────────────────────────────────
  const requestOtp = async (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    const fullPhone = digits.length === 10 ? `+91${digits}` : rawPhone.trim();
    const res = await authService.generateOTP(fullPhone);
    if (res.success) {
      setResendTimer(120);
      setOtpDigits(['','','','','','']);
      setDevOtp('');
      if (res.data?.otp) setDevOtp(String(res.data.otp));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    return res;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Please enter your mobile number'); return; }
    setError(''); setLoading(true);
    try {
      await requestOtp(phone);
      setOtpStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const fullPhone = digits.length === 10 ? `+91${digits}` : phone.trim();
      const res = await authService.verifyOTP(fullPhone, fullOtp);
      if (res.success) {
        saveSession(res.data.accessToken, res.data.user, rememberMe);
        onLogin(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
      setOtpDigits(['','','','','','']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP box handlers ─────────────────────────────────────────────────────────
  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputBase = `w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white
    placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/60
    transition-all duration-200 text-sm`;

  const primaryBtn = `w-full py-3.5 font-semibold rounded-xl transition-all duration-200
    flex items-center justify-center gap-2 text-sm
    disabled:opacity-50 disabled:cursor-not-allowed`;

  // ── Remember Me checkbox ─────────────────────────────────────────────────────
  const RememberMeRow = () => (
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2.5 cursor-pointer group select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            rememberMe
              ? 'border-cyan-500 bg-cyan-500/20'
              : 'border-white/20 bg-white/5 group-hover:border-white/40'
          }`}>
            {rememberMe && (
              <svg className="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Cookie className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" />
          <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
            Remember me ...
          </span>
        </div>
      </label>
      {rememberMe && (
        <span className="text-[10px] text-cyan-500/70 font-medium tracking-wide">
           Cookie saved
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)' }}>

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

      <div className="relative w-full max-w-[420px]">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
                 style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nila Healthcare</h1>
          <p className="text-white/40 mt-1 text-sm">
            {mode === 'admin' ? 'Admin & Expert Portal' : 'Patient Portal'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl shadow-2xl overflow-hidden"
             style={{
               background: 'rgba(255,255,255,0.04)',
               backdropFilter: 'blur(24px)',
               border: '1px solid rgba(255,255,255,0.08)',
             }}>

          {/* Mode toggle */}
          <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {(['patient', 'admin'] as LoginMode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={mode === m ? {
                    color: 'white',
                    background: m === 'patient'
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    boxShadow: m === 'patient'
                      ? '0 4px 15px rgba(6,182,212,0.3)'
                      : '0 4px 15px rgba(124,58,237,0.3)',
                  } : { color: 'rgba(255,255,255,0.4)' }}>
                  {m === 'patient' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {m === 'patient' ? 'Patient' : 'Admin / Expert'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-7">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl p-3.5 mb-5 text-sm"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {/* ── Admin ── */}
            {mode === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
                  <p className="text-xs text-white/35 mb-6">Sign in to your admin account</p>

                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@.com"
                      className={inputBase} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`${inputBase} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <RememberMeRow />

                <button type="submit" disabled={loading} className={`${primaryBtn} mt-2`}
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                    : <><ShieldCheck className="w-4 h-4" />Sign In</>}
                </button>
              </form>
            )}

            {/* ── Patient ── */}
            {mode === 'patient' && (
              <>
                {/* Step 1: Phone */}
                {otpStep === 'phone' && (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Patient Login</h2>
                      <p className="text-xs text-white/35 mb-6">Enter your registered mobile number</p>

                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Mobile number</label>
                      <div className="flex">
                        <span className="flex items-center gap-1.5 px-3.5 text-sm text-white/60 font-medium select-none whitespace-nowrap rounded-l-xl"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none' }}>
                          <Phone className="w-3.5 h-3.5" /> +91
                        </span>
                        <input type="tel" required maxLength={10} value={phone} autoFocus
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className="flex-1 bg-white/5 border border-white/10 rounded-r-xl px-4 py-3.5 text-white
                                     placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                                     focus:border-cyan-500/60 transition-all duration-200 text-sm" />
                      </div>
                    </div>

                    {/* Remember Me */}
                    <RememberMeRow />

                    <button type="submit" disabled={loading || phone.length < 10} className={primaryBtn}
                      style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 20px rgba(6,182,212,0.4)' }}>
                      {loading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending OTP...</>
                        : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}

                {/* Step 2: OTP */}
                {otpStep === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Verify OTP</h2>
                      <p className="text-xs text-white/35 mb-1">
                        6-digit code sent to{' '}
                        <span className="text-cyan-400 font-semibold">+91 {phone}</span>
                      </p>
                      <button type="button"
                        onClick={() => { setOtpStep('phone'); setError(''); setOtpDigits(['','','','','','']); setDevOtp(''); }}
                        className="text-xs text-white/35 hover:text-white/60 flex items-center gap-1 mb-6 transition-colors">
                        <RotateCcw className="w-3 h-3" /> Change number
                      </button>

                      {/* Dev OTP */}
                      {devOtp && (
                        <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-5"
                             style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                          <div>
                            <p className="text-xs text-amber-400/70 font-medium uppercase tracking-wider mb-0.5">OTP (SMS unavailable)</p>
                            <p className="text-xl font-bold text-amber-300 tracking-[0.35em] font-mono">{devOtp}</p>
                          </div>
                          <button type="button"
                            onClick={() => {
                              setOtpDigits(devOtp.split(''));
                              inputRefs.current[5]?.focus();
                            }}
                            className="text-xs text-amber-400 hover:text-amber-200 transition-colors underline underline-offset-2">
                            Fill in
                          </button>
                        </div>
                      )}

                      {/* OTP boxes */}
                      <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <input key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text" inputMode="numeric" maxLength={1} autoComplete="one-time-code"
                            value={digit}
                            onChange={e => handleOtpDigit(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            className="w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2"
                            style={{
                              background: digit ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.04)',
                              borderColor: digit ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)',
                              color: digit ? '#67e8f9' : 'white',
                            }}
                            autoFocus={i === 0} />
                        ))}
                      </div>
                    </div>

                    <button type="submit" disabled={loading || otpDigits.join('').length !== 6}
                      className={primaryBtn}
                      style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 20px rgba(6,182,212,0.4)' }}>
                      {loading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                        : <><ShieldCheck className="w-4 h-4" />Verify & Sign In</>}
                    </button>

                    {/* Resend */}
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-white/30">
                          Resend OTP in{' '}
                          <span className="text-cyan-400 font-semibold tabular-nums">{formatTimer(resendTimer)}</span>
                        </p>
                      ) : (
                        <button type="button"
                          onClick={async () => {
                            setError('');
                            setOtpDigits(['','','','','','']);
                            setDevOtp('');
                            setLoading(true);
                            try { await requestOtp(phone); }
                            catch { setError('Failed to resend OTP. Please try again.'); }
                            finally { setLoading(false); }
                          }}
                          disabled={loading}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2 disabled:opacity-50">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Cookie info banner */}
            <div className="mt-5 rounded-xl p-3 flex items-start gap-2.5"
                 style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
              <Cookie className="w-3.5 h-3.5 text-cyan-500/50 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/25 leading-relaxed">
                {rememberMe
                  ? 'Your session will be saved as a cookie for 30 days. Uncheck "Remember me" to use session-only login.'
                  : 'Session-only mode — you\'ll be logged out when the browser tab closes. Check "Remember me" to stay signed in.'}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-white/25 text-center leading-relaxed">
                {mode === 'admin'
                  ? 'Admin & Expert access only. Contact your system administrator for access.'
                  : 'Login is available only for registered patients. Contact the clinic to register.'}
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
