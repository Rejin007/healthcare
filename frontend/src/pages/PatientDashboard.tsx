import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Calendar, Clock, Video, MapPin, LogOut,
  Phone, Mail, CheckCircle, ChevronLeft, ChevronRight,
  IndianRupee, Loader2, Edit3, Save, X, AlertCircle,
  RefreshCw, PlusCircle, ArrowRight, User, Shield,
  Sparkles, Menu, Home, CalendarDays, TrendingUp,
  Lock, Zap, Star, Heart, Bell, Search, PartyPopper, Hand
} from 'lucide-react';
import { appointmentService } from '../services/appointment.service';
import { useAuth } from '../App';
import api from '../services/api';
import BookingFlow from './booking/BookingFlow';

/* ─── Scroll-reveal (matches Home.tsx) ──────────────────────────────────── */
function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const Reveal: React.FC<{
  children: React.ReactNode; delay?: number; className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'none' : 'translateY(22px)',
      transition: `opacity 0.6s cubic-bezier(.2,.8,.4,1) ${delay}s, transform 0.6s cubic-bezier(.2,.8,.4,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Appt {
  id: string; start_time: string; end_time: string;
  mode: 'online' | 'inperson'; status: string;
  expert_name?: string; amount?: number;
  payment_status?: string; google_meet_link?: string;
}

const STATUS: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  scheduled:     { label: 'Scheduled',   bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)',  dot: '#3b82f6' },
  confirmed:     { label: 'Confirmed',   bg: 'rgba(16,185,129,0.1)', text: 'var(--success-light)', border: 'rgba(16,185,129,0.25)', dot: 'var(--success)' },
  'in-progress': { label: 'In Progress', bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', dot: 'var(--warning)' },
  completed:     { label: 'Completed',   bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)', dot: 'var(--secondary-light)' },
  cancelled:     { label: 'Cancelled',   bg: 'rgba(239,68,68,0.1)',  text: '#f87171', border: 'rgba(239,68,68,0.25)',  dot: 'var(--danger)' },
  'no-show':     { label: 'No Show',     bg: 'rgba(100,116,139,0.1)',text: '#94a3b8', border: 'rgba(100,116,139,0.25)',dot: '#64748b' },
};

type Tab   = 'upcoming' | 'all' | 'completed';
type View  = 'dashboard' | 'booking';
type Panel = 'appointments' | 'profile';

/* ─── Main Component ─────────────────────────────────────────────────────── */
const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [view,      setView]      = useState<View>('dashboard');
  const [panel,     setPanel]     = useState<Panel>('appointments');
  const [navOpen,   setNavOpen]   = useState(false);
  const [scrolled,  setScrolled]  = useState(false);

  const [appts,      setAppts]      = useState<Appt[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Tab>('upcoming');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [upcomingCount,  setUpcomingCount]  = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [allCount,       setAllCount]       = useState<number | null>(null);

  const [editing, setEditing] = useState(false);
  const [pName,   setPName]   = useState(user?.full_name || '');
  const [pEmail,  setPEmail]  = useState(user?.email    || '');
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [newApptId, setNewApptId] = useState<string | null>(null);

  /* Scroll detection — same as Home.tsx nav */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { if (view === 'dashboard') load(); }, [tab, page, view]);

  /* Fetch counts */
  useEffect(() => {
    if (!user?.id || view !== 'dashboard') return;
    const uid = user.id;
    appointmentService.getAll(1, 1, { user_id: uid, statuses: 'scheduled,confirmed', upcoming: 'true' })
      .then(r => setUpcomingCount(r.data?.pagination?.totalItems ?? 0)).catch(() => {});
    appointmentService.getAll(1, 1, { user_id: uid, status: 'completed' })
      .then(r => setCompletedCount(r.data?.pagination?.totalItems ?? 0)).catch(() => {});
    appointmentService.getAll(1, 1, { user_id: uid })
      .then(r => setAllCount(r.data?.pagination?.totalItems ?? 0)).catch(() => {});
  }, [user?.id, view]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const filters: Record<string, string> = { user_id: user.id };
      if (tab === 'upcoming')  { filters.statuses = 'scheduled,confirmed'; filters.upcoming = 'true'; }
      if (tab === 'completed') { filters.status = 'completed'; }
      const res = await appointmentService.getAll(page, 6, filters);
      setAppts(res.data.appointments || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch { setAppts([]); }
    finally  { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true); setSaveErr('');
    try {
      await api.put(`/patients/${user.id}`, { full_name: pName, email: pEmail });
      localStorage.setItem('user', JSON.stringify({ ...user, full_name: pName, email: pEmail }));
      setEditing(false); window.location.reload();
    } catch (e: any) { setSaveErr(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const fmt      = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime  = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const isToday  = (iso: string) => { const d = new Date(iso), t = new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); };
  const isTomorrow = (iso: string) => { const d = new Date(iso), t = new Date(); t.setDate(t.getDate()+1); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); };
  const initials = (n?: string) => (n || 'P').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();

  /* ── Booking view (full-screen, no nav) ─── */
  if (view === 'booking') {
    return (
      <BookingFlow
        user={user}
        onBackToDashboard={(apptId?: string) => {
          setView('dashboard');
          setPanel('appointments');
          setTab('upcoming');
          if (apptId) setNewApptId(apptId);
          load();
        }}
      />
    );
  }

  /* ─── Nav items ──────────────────────────────────────────────────────── */
  const navLinks = [
    { label: 'My Appointments', panel: 'appointments' as Panel },
    { label: 'My Profile',      panel: 'profile'      as Panel },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ── Ambient background (matches Home.tsx) ──────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 right-0 w-[800px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 65%)', transform: 'translate(25%,-20%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%)', transform: 'translate(-25%,25%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.8) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute top-24 right-[8%] w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07), transparent)', animationDuration: '7s', opacity: 0.6 }} />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          NAV — identical glass-morphism design as Home.tsx
      ═══════════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(7,17,30,0.97)' : 'rgba(7,17,30,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid rgba(6,182,212,0.12)' : '1px solid rgba(255,255,255,0.04)',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        }}>

        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-10 py-4">

          {/* Logo — same as Home.tsx */}
          <Link to="/home" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-[15px] font-bold text-white block">Nila Healthcare</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest block mt-0.5" style={{ color: '#334155' }}>Patient Portal</span>
            </div>
          </Link>

          {/* Desktop — dashboard nav links */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {navLinks.map(nl => (
              <button key={nl.panel}
                onClick={() => setPanel(nl.panel)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: panel === nl.panel ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                  color:      panel === nl.panel ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow:  panel === nl.panel ? '0 2px 10px rgba(6,182,212,0.3)' : 'none',
                }}>
                {nl.label}
                {nl.panel === 'appointments' && upcomingCount != null && upcomingCount > 0 && (
                  <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full align-middle"
                    style={{ background: 'rgba(255,255,255,0.2)', color: panel === nl.panel ? '#fff' : 'var(--primary-light)' }}>
                    {upcomingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop right: Home link + Book + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/home"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; }}>
              <Home className="w-3.5 h-3.5" /> Home
            </Link>

            <button onClick={() => setView('booking')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 18px rgba(6,182,212,0.35)' }}>
              <PlusCircle className="w-4 h-4" /> Book Session
            </button>

            <button onClick={logout}
              className="p-2.5 rounded-xl transition-all duration-200"
              title="Sign out"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(239,68,68,0.4)'; (e.currentTarget as HTMLElement).style.color='#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='#475569'; }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setNavOpen(o => !o)}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {navOpen && (
          <div className="md:hidden px-5 pb-5 space-y-1 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {navLinks.map(nl => (
              <button key={nl.panel} onClick={() => { setPanel(nl.panel); setNavOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: panel === nl.panel ? 'rgba(6,182,212,0.12)' : 'transparent',
                  color:      panel === nl.panel ? 'var(--primary-light)' : '#64748b',
                  border:     `1px solid ${panel === nl.panel ? 'rgba(6,182,212,0.25)' : 'transparent'}`,
                }}>
                {nl.label}
              </button>
            ))}
            <Link to="/home" onClick={() => setNavOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ color: '#64748b' }}>
              <Home className="w-4 h-4" /> Back to Home
            </Link>
            <button onClick={() => { setView('booking'); setNavOpen(false); }}
              className="w-full mt-2 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
              Book a Session
            </button>
            <button onClick={logout}
              className="w-full py-2.5 rounded-xl text-sm font-medium mt-1"
              style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── APPOINTMENTS PANEL ───────────────────────────────────── */}
        {panel === 'appointments' && (
          <>
            {/* ── Booking confirmed banner (shown right after successful payment) */}
            {newApptId && (
              <Reveal>
                <div className="relative rounded-3xl overflow-hidden px-7 py-5 flex items-center justify-between gap-4"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">Booking Confirmed! <PartyPopper className="w-4 h-4" style={{ color: 'var(--success)' }} /></p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        Your appointment is booked &amp; showing below. Booking ID: <span className="font-mono font-semibold" style={{ color: 'var(--success-light)' }}>#{newApptId.slice(0, 8).toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setNewApptId(null)}
                    className="p-1.5 rounded-xl transition-colors flex-shrink-0"
                    style={{ color: '#334155' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#334155'}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </Reveal>
            )}

            {/* ── Hero welcome banner — same language as Home.tsx CTA section */}
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden px-7 py-8"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.09) 0%, rgba(59,130,246,0.06) 50%, rgba(124,58,237,0.06) 100%)', border: '1px solid rgba(6,182,212,0.2)' }}>
                {/* Glow top-right */}
                <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 65%)', transform: 'translate(30%,-30%)' }} />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-bold"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--primary-light)' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Welcome back
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight flex items-center gap-3" style={{ letterSpacing: '-0.025em' }}>
                      Hi, {user?.full_name?.split(' ')[0] || 'there'} <Hand className="w-7 h-7" style={{ color: '#fbbf24' }} />
                    </h1>
                    <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                      {upcomingCount
                        ? `You have ${upcomingCount} upcoming session${upcomingCount !== 1 ? 's' : ''} — we're with you every step.`
                        : 'Your wellness journey starts here. Book your first session today.'}
                    </p>
                  </div>

                  <button onClick={() => setView('booking')}
                    className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 6px 24px rgba(6,182,212,0.35)' }}>
                    <PlusCircle className="w-4 h-4" /> Book a Session
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* ── Stats row — same card pattern as Home.tsx stats strip */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total',     value: allCount,       icon: CalendarDays, color: 'var(--primary)', glow: 'rgba(6,182,212,0.1)',   tab: 'all'       as Tab },
                { label: 'Upcoming',  value: upcomingCount,  icon: Clock,        color: 'var(--warning)', glow: 'rgba(245,158,11,0.1)',  tab: 'upcoming'  as Tab },
                { label: 'Completed', value: completedCount, icon: CheckCircle,  color: 'var(--success)', glow: 'rgba(16,185,129,0.1)', tab: 'completed' as Tab },
              ].map((s, i) => {
                const Icon   = s.icon;
                const active = tab === s.tab;
                return (
                  <Reveal key={s.label} delay={i * 0.06}>
                    <button onClick={() => setTab(s.tab)}
                      className="w-full p-5 rounded-3xl text-center transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: active ? s.glow : 'rgba(10,18,32,0.9)',
                        border:     `1px solid ${active ? s.color + '35' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow:  active ? `0 12px 32px ${s.glow}` : 'none',
                      }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: s.glow, border: `1px solid ${s.color}22` }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <p className="text-2xl font-bold leading-none"
                        style={{ color: s.value !== null ? s.color : '#1e3050' }}>
                        {s.value !== null ? s.value : '—'}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider mt-1.5"
                        style={{ color: '#334155' }}>
                        {s.label}
                      </p>
                    </button>
                  </Reveal>
                );
              })}
            </div>

            {/* ── Appointments card — same card style as Home.tsx feature cards */}
            <Reveal delay={0.1}>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>

                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,14,26,0.5)' }}>
                  <div className="flex items-center gap-1 p-1 rounded-xl"
                    style={{ background: 'rgba(7,14,26,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {(['upcoming','all','completed'] as Tab[]).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg capitalize transition-all duration-200"
                        style={{
                          background: tab === t ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                          color:      tab === t ? '#fff' : '#475569',
                          boxShadow:  tab === t ? '0 0 12px rgba(6,182,212,0.3)' : 'none',
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>

                  <button onClick={load}
                    className="p-2 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#334155' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#94a3b8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#334155'}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Appointment list */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(6,182,212,0.1)', borderTopColor: 'var(--primary)' }} />
                    <p className="text-sm" style={{ color: '#1e3050' }}>Loading appointments…</p>
                  </div>

                ) : appts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-5">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Calendar className="w-9 h-9 opacity-15" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold mb-1" style={{ color: '#334155' }}>No {tab} appointments</p>
                      <p className="text-sm" style={{ color: '#1e3050' }}>
                        {tab === 'upcoming' ? 'Book a session to begin your journey' : 'Nothing to show here yet'}
                      </p>
                    </div>
                    {tab === 'upcoming' && (
                      <button onClick={() => setView('booking')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 6px 20px rgba(6,182,212,0.3)' }}>
                        <PlusCircle className="w-4 h-4" /> Book Your First Session
                      </button>
                    )}
                  </div>

                ) : (
                  <div>
                    {appts.map((appt, idx) => {
                      const st      = STATUS[appt.status] || STATUS.scheduled;
                      const today   = isToday(appt.start_time);
                      const tmrw    = isTomorrow(appt.start_time);
                      const online  = appt.mode === 'online';
                      const isLast  = idx === appts.length - 1;

                      return (
                        <div key={appt.id}
                          className="px-6 py-5 transition-all duration-200"
                          style={{
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            background: appt.id === newApptId
                              ? 'rgba(16,185,129,0.04)'
                              : today ? 'rgba(6,182,212,0.025)' : 'transparent',
                            outline: appt.id === newApptId ? '1px solid rgba(16,185,129,0.2)' : 'none',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = appt.id === newApptId ? 'rgba(16,185,129,0.04)' : today ? 'rgba(6,182,212,0.025)' : 'transparent'}>

                          <div className="flex items-start gap-4">
                            {/* Mode icon — same rounded style as Home feature cards */}
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{
                                background: online ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                                border: `1px solid ${online ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
                              }}>
                              {online
                                ? <Video  className="w-4.5 h-4.5" style={{ color: '#60a5fa' }} />
                                : <MapPin className="w-4.5 h-4.5" style={{ color: 'var(--success-light)' }} />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-white">{appt.expert_name || 'Doctor'}</p>
                                  {today && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                                      style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                                      Today
                                    </span>
                                  )}
                                  {tmrw && !today && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                                      style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(6,182,212,0.25)' }}>
                                      Tomorrow
                                    </span>
                                  )}
                                </div>
                                {/* Status pill */}
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                                  style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                                  {st.label}
                                </span>
                              </div>

                              {/* Date + time */}
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-3">
                                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#475569' }}>
                                  <Calendar className="w-3 h-3" />{fmt(appt.start_time)}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#475569' }}>
                                  <Clock className="w-3 h-3" />{fmtTime(appt.start_time)}
                                </span>
                                {appt.amount != null && appt.amount > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'var(--success)' }}>
                                    ₹{appt.amount}
                                  </span>
                                )}
                              </div>

                              {/* Badges row */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
                                  style={{
                                    background: online ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                                    color:      online ? '#60a5fa' : 'var(--success-light)',
                                    border: `1px solid ${online ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                  }}>
                                  {online ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                  {online ? 'Video Call' : 'In-Person'}
                                </span>

                                {appt.payment_status === 'completed' && (
                                  <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
                                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success-light)' }}>
                                    <CheckCircle className="w-3 h-3" /> Paid
                                  </span>
                                )}
                                {appt.payment_status === 'pending' && (
                                  <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
                                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                                    <Clock className="w-3 h-3" /> Payment pending
                                  </span>
                                )}
                              </div>

                              {/* Join call CTA */}
                              {online && appt.google_meet_link && ['confirmed','in-progress','scheduled'].includes(appt.status) && (
                                <a href={appt.google_meet_link} target="_blank" rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.4)' }}>
                                  <Video className="w-3.5 h-3.5" /> Join Video Call →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(7,14,26,0.4)' }}>
                    <p className="text-xs" style={{ color: '#1e3050' }}>
                      Page {page} of {totalPages} · {totalItems} total
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
                        ← Prev
                      </button>
                      <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* ── "Why care" strip — mirrors Home.tsx Why Nila section ─── */}
            <Reveal delay={0.08}>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Shield,  color: 'var(--primary-light)', title: 'Confidential',      desc: 'All your sessions and data are fully encrypted and private.' },
                  { icon: Zap,     color: '#a78bfa', title: 'Instant Booking',   desc: 'Find a slot and confirm in under 2 minutes, any time.' },
                  { icon: Heart,   color: 'var(--success-light)', title: 'Verified Experts',  desc: 'Every therapist is licensed and background-checked.' },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title}
                      className="p-5 rounded-3xl transition-all duration-300"
                      style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=f.color+'30'; (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform='none'; }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: f.color+'15', border: `1px solid ${f.color}25` }}>
                        <Icon className="w-5 h-5" style={{ color: f.color }} />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PROFILE PANEL
        ════════════════════════════════════════════════════════════ */}
        {panel === 'profile' && (
          <>
            {/* Profile hero — same aesthetic as Home.tsx CTA banner */}
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden px-7 py-8"
                style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.1) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(6,182,212,0.22)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 65%)', transform: 'translate(30%,-30%)' }} />

                <div className="relative flex items-center gap-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold flex-shrink-0 text-white"
                    style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 30px rgba(6,182,212,0.3)' }}>
                    {initials(user?.full_name)}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 text-[11px] font-bold"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--success-light)' }}>
                      <Shield className="w-3 h-3" /> Verified Patient
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                      {user?.full_name || 'Patient'}
                    </h2>
                    <div className="flex flex-wrap gap-4 mt-1.5">
                      {user?.phone && (
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                          <Phone className="w-3.5 h-3.5" style={{ color: '#334155' }} />{user.phone}
                        </span>
                      )}
                      {user?.email && (
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                          <Mail className="w-3.5 h-3.5" style={{ color: '#334155' }} />{user.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Quick session stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total',     value: allCount,       color: 'var(--primary)' },
                { label: 'Upcoming',  value: upcomingCount,  color: 'var(--warning)' },
                { label: 'Completed', value: completedCount, color: 'var(--success)' },
              ].map((s, i) => (
                <Reveal key={s.label} delay={i * 0.06}>
                  <div className="p-5 rounded-3xl text-center"
                    style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-2xl font-bold leading-none mb-1" style={{ color: s.value !== null ? s.color : '#1e3050' }}>
                      {s.value !== null ? s.value : '—'}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Edit profile card */}
            <Reveal delay={0.08}>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>

                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,14,26,0.4)' }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Profile Information</p>
                    <p className="text-sm font-bold text-white mt-0.5">Your Details</p>
                  </div>
                  {!editing && (
                    <button onClick={() => { setEditing(true); setPName(user?.full_name || ''); setPEmail(user?.email || ''); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--primary-light)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(6,182,212,0.18)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(6,182,212,0.1)'}>
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="p-6 grid sm:grid-cols-2 gap-4">
                    {[
                      { icon: User,  label: 'Full Name', value: user?.full_name || '—' },
                      { icon: Phone, label: 'Phone',     value: user?.phone    || '—' },
                      { icon: Mail,  label: 'Email',     value: user?.email    || 'Not set' },
                    ].map(field => {
                      const Icon = field.icon;
                      return (
                        <div key={field.label} className="p-4 rounded-2xl"
                          style={{ background: 'rgba(7,14,26,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-3.5 h-3.5" style={{ color: '#1e3050' }} />
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1e3050' }}>{field.label}</p>
                          </div>
                          <p className="text-sm font-medium"
                            style={{ color: field.value === 'Not set' ? 'var(--warning)' : '#94a3b8' }}>
                            {field.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 space-y-5">
                    {saveErr && (
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#334155' }}>Full Name</label>
                        <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Your name"
                          className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none transition-all"
                          style={{ background: 'rgba(7,14,26,0.9)', border: '1px solid rgba(30,48,80,0.8)', color: 'var(--text-primary)' }}
                          onFocus={e => e.target.style.borderColor='var(--primary)'}
                          onBlur={e => e.target.style.borderColor='rgba(30,48,80,0.8)'} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#334155' }}>Email</label>
                        <input type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none transition-all"
                          style={{ background: 'rgba(7,14,26,0.9)', border: '1px solid rgba(30,48,80,0.8)', color: 'var(--text-primary)' }}
                          onFocus={e => e.target.style.borderColor='var(--primary)'}
                          onBlur={e => e.target.style.borderColor='rgba(30,48,80,0.8)'} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={saveProfile} disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 6px 20px rgba(6,182,212,0.3)' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                      <button onClick={() => { setEditing(false); setSaveErr(''); }}
                        className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(30,48,80,0.5)', color: '#64748b', border: '1px solid rgba(30,48,80,0.8)' }}>
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Quick actions — same card style */}
            <Reveal delay={0.12}>
              <div className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => setPanel('appointments')}
                  className="flex items-center gap-4 p-5 rounded-3xl text-left transition-all duration-200 hover:-translate-y-1"
                  style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 32px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <Calendar className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">My Appointments</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>View upcoming & past sessions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto" style={{ color: '#1e3050' }} />
                </button>

                <button onClick={() => setView('booking')}
                  className="flex items-center gap-4 p-5 rounded-3xl text-left transition-all duration-200 hover:-translate-y-1"
                  style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(124,58,237,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 32px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <PlusCircle className="w-5 h-5" style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Book New Session</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Find a therapist & schedule</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto" style={{ color: '#1e3050' }} />
                </button>
              </div>
            </Reveal>
          </>
        )}

        {/* Bottom padding */}
        <div className="h-10" />
      </div>

      {/* ── Footer — same as Home.tsx ──────────────────────────────── */}
      <footer className="relative z-10 px-6 py-10 mt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Nila Healthcare</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#1e3050' }}>Patient Portal</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs" style={{ color: '#1e3050' }}>
            <Link to="/home" className="hover:text-slate-400 transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> Home
            </Link>
            <button onClick={() => setPanel('appointments')} className="hover:text-slate-400 transition-colors">Appointments</button>
            <button onClick={() => setPanel('profile')} className="hover:text-slate-400 transition-colors">Profile</button>
            <button onClick={() => setView('booking')} className="hover:text-slate-400 transition-colors">Book Session</button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#0d1928' }}>
            <Lock className="w-3 h-3" /> Your data is encrypted & secure
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PatientDashboard;
