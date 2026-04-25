import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, User, Mail, Phone, Calendar,
  Loader2, AlertCircle, CheckCircle, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { patientService } from '../../services/patient.service';

interface Props {
  onBack: () => void;
  onSuccess: (user: any, token: string) => void;
}

type Mode = 'phone' | 'otp' | 'create' | 'create-otp';

/* ── OTP input boxes ─────────────────────────────────────────────────────── */
interface OtpBoxesProps {
  digits: string[];
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  devOtp?: string;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange:  (index: number, val: string) => void;
}

const OtpBoxes: React.FC<OtpBoxesProps> = ({ digits, devOtp, refs, onKeyDown, onChange }) => (
  <div className="space-y-4">
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={d}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          autoFocus={i === 0}
          className="text-center text-xl font-bold rounded-xl transition-all"
          style={{
            background: d ? 'var(--primary-glow)' : 'var(--bg-elevated)',
            border: `2px solid ${d ? 'var(--border-accent)' : 'var(--border-medium)'}`,
            color: 'var(--text-primary)',
            width: '2.75rem', height: '3.25rem',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
          onBlur={e  => { e.target.style.borderColor = d ? 'var(--border-accent)' : 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
    {devOtp && (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid var(--border-accent)', color: 'var(--primary-light)' }}>
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
        Dev OTP: <span className="font-mono font-bold tracking-widest">{devOtp}</span>
      </div>
    )}
  </div>
);

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const modeToLabel: Record<Mode, string> = {
  phone:        'Contact Number',
  otp:          'Verify OTP',
  create:       'Create Account',
  'create-otp': 'Verify Phone',
};

/* ══════════════════════════════════════════════════════════════════════════ */
const AccountSetupPage: React.FC<Props> = ({ onBack, onSuccess }) => {

  const [mode,    setMode]    = useState<Mode>('phone');
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* login-OTP */
  const [otpDigits,   setOtpDigits]   = useState(['','','','','','']);
  const [devOtp,      setDevOtp]      = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* create-account */
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [age,      setAge]      = useState('');

  /* create-OTP */
  const [createOtpDigits,   setCreateOtpDigits]   = useState(['','','','','','']);
  const [createDevOtp,      setCreateDevOtp]       = useState('');
  const [createResendTimer, setCreateResendTimer]  = useState(0);
  const createOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    if (createResendTimer <= 0) return;
    const t = setTimeout(() => setCreateResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [createResendTimer]);

  useEffect(() => {
    if (mode === 'otp' && otpDigits.join('').length === 6 && !loading)
      handleVerifyLoginOtp();
  }, [otpDigits, mode]);

  useEffect(() => {
    if (mode === 'create-otp' && createOtpDigits.join('').length === 6 && !loading)
      handleVerifyCreateOtp();
  }, [createOtpDigits, mode]);

  /* OTP box handlers — login */
  const handleOtpChange = (index: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    if (!ch) return;
    setOtpDigits(prev => { const d = [...prev]; d[index] = ch; return d; });
    if (index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setOtpDigits(prev => {
        const d = [...prev];
        if (d[index]) { d[index] = ''; return d; }
        if (index > 0) { d[index - 1] = ''; otpRefs.current[index - 1]?.focus(); return d; }
        return d;
      });
    }
  };

  /* OTP box handlers — create */
  const handleCreateOtpChange = (index: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    if (!ch) return;
    setCreateOtpDigits(prev => { const d = [...prev]; d[index] = ch; return d; });
    if (index < 5) createOtpRefs.current[index + 1]?.focus();
  };
  const handleCreateOtpKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setCreateOtpDigits(prev => {
        const d = [...prev];
        if (d[index]) { d[index] = ''; return d; }
        if (index > 0) { d[index - 1] = ''; createOtpRefs.current[index - 1]?.focus(); return d; }
        return d;
      });
    }
  };

  /* ── STEP 1: phone entry — detect registered vs new ── */
  const handlePhoneContinue = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) { setError('Please enter a valid 10-digit phone number'); return; }
    setLoading(true); setError('');
    try {
      const res = await authService.generateOTP(cleaned);
      if (res?.otp) setDevOtp(String(res.otp));
      setResendTimer(120);
      setOtpDigits(['','','','','','']);
      setMode('otp');
    } catch (e: any) {
      const msg: string = (e.response?.data?.message || e.message || '').toLowerCase();
      const isNotFound =
        msg.includes('not found') || msg.includes('no user') ||
        msg.includes('not registered') || msg.includes('does not exist') ||
        e.response?.status === 404;
      if (isNotFound) {
        setError('');
        setMode('create');
      } else {
        setError(e.response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    } finally { setLoading(false); }
  };

  /* ── STEP 2a: verify OTP → login ── */
  const handleVerifyLoginOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) return;
    setLoading(true); setError('');
    try {
      const res   = await authService.verifyOTP(phone.replace(/\D/g,''), code);
      const token = res?.data?.accessToken || res?.accessToken || res?.token;
      const user  = res?.data?.user  || res?.user  || res?.patient;
      if (!token || !user) throw new Error('Verification failed — unexpected response');
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      onSuccess(user, token);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtpDigits(['','','','','','']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResendLoginOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await authService.generateOTP(phone.replace(/\D/g,''));
      if (res?.otp) setDevOtp(String(res.otp));
      setResendTimer(120); setOtpDigits(['','','','','','']);
    } catch { setError('Failed to resend OTP'); }
    finally { setLoading(false); }
  };

  /* ── STEP 2b: create account ── */
  const handleCreateSubmit = async () => {
    setError('');
    if (!fullName.trim()) { setError('Please enter your full name'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    if (!age || isNaN(+age) || +age < 1 || +age > 120) { setError('Please enter a valid age'); return; }
    const cleaned = phone.replace(/\D/g,'');
    setLoading(true);
    try {
      await patientService.publicCreate({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleaned,
        age: parseInt(age),
      });
      const otpRes = await authService.generateOTP(cleaned);
      if (otpRes?.otp) setCreateDevOtp(String(otpRes.otp));
      setCreateResendTimer(120);
      setCreateOtpDigits(['','','','','','']);
      setMode('create-otp');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Registration failed';
      setError(
        msg.includes('duplicate') || msg.includes('already') || msg.includes('unique')
          ? 'Email or phone already registered. Try going back to sign in instead.'
          : msg
      );
    } finally { setLoading(false); }
  };

  /* ── STEP 2c: verify OTP after create ── */
  const handleVerifyCreateOtp = async () => {
    const code = createOtpDigits.join('');
    if (code.length < 6) return;
    setLoading(true); setError('');
    try {
      const res   = await authService.verifyOTP(phone.replace(/\D/g,''), code);
      const token = res?.data?.accessToken || res?.accessToken || res?.token;
      const user  = res?.data?.user  || res?.user  || res?.patient;
      if (!token || !user) throw new Error('Verification failed — unexpected response');
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      onSuccess(user, token);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid OTP. Please try again.');
      setCreateOtpDigits(['','','','','','']);
      createOtpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResendCreateOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await authService.generateOTP(phone.replace(/\D/g,''));
      if (res?.otp) setCreateDevOtp(String(res.otp));
      setCreateResendTimer(120); setCreateOtpDigits(['','','','','','']);
    } catch { setError('Failed to resend OTP'); }
    finally { setLoading(false); }
  };

  const handleBack = () => {
    setError('');
    if (mode === 'phone')      return onBack();
    if (mode === 'otp')        return setMode('phone');
    if (mode === 'create')     return setMode('phone');
    if (mode === 'create-otp') return setMode('create');
  };

  /* ── Shared header ── */
  const Header = () => (
    <div className="sticky top-0 z-10 backdrop-blur-sm px-4 py-3"
      style={{ background: 'rgba(7,14,26,0.95)', borderBottom: '1px solid var(--border-faint)' }}>
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <button onClick={handleBack} className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Step 3 of 5</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{modeToLabel[mode]}</p>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3,4,5].map(s => (
            <div key={s} className="h-2 rounded-full transition-all"
              style={{ width: s === 3 ? '20px' : '8px', background: s <= 3 ? 'var(--primary)' : 'var(--border-medium)' }} />
          ))}
        </div>
      </div>
    </div>
  );

  const ErrorBanner = () => error ? (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
      <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
    </div>
  ) : null;

  const StickyBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
      style={{ background: 'rgba(7,14,26,0.97)', borderTop: '1px solid var(--border-faint)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={onClick} disabled={disabled}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', boxShadow: '0 4px 20px var(--primary-glow)' }}>
          {children}
        </button>
      </div>
    </div>
  );

  /* ═══ MODE: phone ═══════════════════════════════════════════════════════ */
  if (mode === 'phone') return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', boxShadow: '0 8px 32px var(--primary-glow)' }}>
            <Phone className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Enter your contact number</h2>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              We'll check if you have an account and send you an OTP.
            </p>
          </div>
        </div>

        <ErrorBanner />

        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
          <label className="text-xs font-semibold flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)', display: 'flex' }}>
            <Phone className="w-3.5 h-3.5" /> Contact Number
          </label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 rounded-xl flex-shrink-0 text-sm font-medium"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
              +91
            </div>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g,'').slice(0,10)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePhoneContinue()}
              placeholder="10-digit mobile number"
              autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-medium)'}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Already registered? We'll send an OTP to sign you in. Otherwise, we'll create a new account.
          </p>
        </div>
      </div>

      <StickyBtn onClick={handlePhoneContinue} disabled={loading || phone.replace(/\D/g,'').length < 10}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
      </StickyBtn>
    </div>
  );

  /* ═══ MODE: otp — registered user login ═════════════════════════════════ */
  if (mode === 'otp') return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.28)' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} />
          <p className="text-sm font-medium" style={{ color: '#6ee7b7' }}>
            Account found! Enter the OTP to sign in to <strong>+91 {phone}</strong>.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'var(--primary-glow)', border: '1px solid var(--border-accent)' }}>
            <ShieldCheck className="w-8 h-8" style={{ color: 'var(--primary-light)' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Enter your OTP</h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Sent to <strong style={{ color: 'var(--text-secondary)' }}>+91 {phone}</strong>
          </p>
        </div>

        <ErrorBanner />

        <OtpBoxes digits={otpDigits} refs={otpRefs} devOtp={devOtp}
          onChange={handleOtpChange} onKeyDown={handleOtpKey} />

        <div className="flex flex-col items-center gap-2">
          {resendTimer > 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Resend in {Math.floor(resendTimer/60)}:{String(resendTimer%60).padStart(2,'0')}
            </p>
          ) : (
            <button onClick={handleResendLoginOtp} disabled={loading}
              className="text-xs font-medium hover:opacity-70"
              style={{ color: 'var(--primary-light)' }}>
              Resend OTP
            </button>
          )}
          <button onClick={() => { setMode('phone'); setError(''); setOtpDigits(['','','','','','']); }}
            className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Wrong number?{' '}
            <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Change it</span>
          </button>
        </div>
      </div>

      <StickyBtn onClick={handleVerifyLoginOtp} disabled={loading || otpDigits.join('').length < 6}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><CheckCircle className="w-4 h-4" /> Sign In &amp; Continue</>}
      </StickyBtn>
    </div>
  );

  /* ═══ MODE: create — new user form ══════════════════════════════════════ */
  if (mode === 'create') return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid var(--border-accent)' }}>
          <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No account found for <strong>+91 {phone}</strong>. Fill in your details below.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Quick setup — just your name, email and age.</p>
        </div>

        <ErrorBanner />

        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>

          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"
              style={{ color: 'var(--text-secondary)', display: 'flex' }}>
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Your full name" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-medium)'} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"
              style={{ color: 'var(--text-secondary)', display: 'flex' }}>
              <Mail className="w-3.5 h-3.5" /> Email Address
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)' }}>Unique</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-medium)'} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"
              style={{ color: 'var(--text-secondary)', display: 'flex' }}>
              <Phone className="w-3.5 h-3.5" /> Contact Number
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                ✓ Set
              </span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 rounded-xl flex-shrink-0 text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                +91
              </div>
              <input type="tel" value={phone} readOnly
                style={{ ...inputStyle, opacity: 0.65, cursor: 'not-allowed' }} />
            </div>
            <button onClick={() => { setMode('phone'); setError(''); }}
              className="mt-1.5 text-xs" style={{ color: 'var(--primary-light)' }}>
              Change number
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"
              style={{ color: 'var(--text-secondary)', display: 'flex' }}>
              <Calendar className="w-3.5 h-3.5" /> Age
            </label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)}
              placeholder="Your age" min={1} max={120}
              style={{ ...inputStyle, width: '8rem' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border-medium)'} />
          </div>
        </div>
      </div>

      <StickyBtn onClick={handleCreateSubmit} disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : <>Create Account <ChevronRight className="w-4 h-4" /></>}
      </StickyBtn>
    </div>
  );

  /* ═══ MODE: create-otp — verify after creation ══════════════════════════ */
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'var(--primary-glow)', border: '1px solid var(--border-accent)' }}>
            <ShieldCheck className="w-8 h-8" style={{ color: 'var(--primary-light)' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Verify your phone</h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Enter the 6-digit OTP sent to{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>+91 {phone}</strong>
          </p>
        </div>

        <ErrorBanner />

        <OtpBoxes digits={createOtpDigits} refs={createOtpRefs} devOtp={createDevOtp}
          onChange={handleCreateOtpChange} onKeyDown={handleCreateOtpKey} />

        <div className="text-center">
          {createResendTimer > 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Resend in {Math.floor(createResendTimer/60)}:{String(createResendTimer%60).padStart(2,'0')}
            </p>
          ) : (
            <button onClick={handleResendCreateOtp} disabled={loading}
              className="text-xs font-medium hover:opacity-70"
              style={{ color: 'var(--primary-light)' }}>
              Resend OTP
            </button>
          )}
        </div>
      </div>

      <StickyBtn onClick={handleVerifyCreateOtp} disabled={loading || createOtpDigits.join('').length < 6}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><CheckCircle className="w-4 h-4" /> Verify &amp; Continue</>}
      </StickyBtn>
    </div>
  );
};

export default AccountSetupPage;
