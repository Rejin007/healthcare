import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Video, MapPin, Shield, Star,
  Clock, Heart, Brain, Users, Search, RefreshCw,
  UserCheck, Calendar, X, Menu, Sparkles, TrendingUp,
  ChevronDown, Phone, IndianRupee, Award, CheckCircle,
  MessageCircle, Lock, Zap
} from 'lucide-react';
import { expertService } from '../services/expert.service';

/* ─── Scroll-reveal ────────────────────────────────────────────────────────── */
function useInView(threshold = 0.1) {
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

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; up?: boolean }> = ({
  children, delay = 0, className = '', up = true
}) => {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'none' : up ? 'translateY(28px)' : 'scale(0.96)',
      transition: `opacity 0.65s cubic-bezier(.2,.8,.4,1) ${delay}s, transform 0.65s cubic-bezier(.2,.8,.4,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
};

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Expert {
  id: string;
  full_name?: string;
  specializations?: string[];
  experience_years?: number;
  bio?: string;
  profile_image?: string;
  online_price?: number;
  inperson_price?: number;
  pricing?: { mode: string; price: number }[];
  availability?: { day_of_week: number; mode?: string }[];
  is_active?: boolean;
}

const GRADS = [
  'from-cyan-500 via-blue-500 to-indigo-600',
  'from-violet-500 via-purple-500 to-pink-500',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-rose-500 via-pink-500 to-fuchsia-600',
  'from-amber-500 via-orange-500 to-red-500',
];

const CATS = ['All','Psychologist','Therapist','Psychiatrist','Counselor','Child Psychologist','Relationship Therapist'];
const DAY_SHORT = ['S','M','T','W','T','F','S'];

/* ─── Therapist Card ─────────────────────────────────────────────────────── */
function TherapistCard({ expert, delay = 0 }: { expert: Expert; delay?: number }) {
  const name     = expert.full_name || 'Therapist';
  const specs    = expert.specializations?.slice(0, 2) || [];
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const grad     = GRADS[name.charCodeAt(0) % GRADS.length];
  const minPrice = Math.min(
    expert.online_price   || Infinity,
    expert.inperson_price || Infinity,
    ...(expert.pricing?.map(p => p.price) || [])
  );
  const onlineDays   = expert.availability?.filter(a => !a.mode || a.mode === 'online').map(a => a.day_of_week) ?? [];
  const inpersonDays = expert.availability?.filter(a => a.mode === 'inperson').map(a => a.day_of_week) ?? [];
  const allDays      = [...new Set([...onlineDays, ...inpersonDays])].sort();
  const hasOnline    = !!(expert.online_price   || expert.pricing?.some(p => p.mode === 'online')   || onlineDays.length);
  const hasInPerson  = !!(expert.inperson_price || expert.pricing?.some(p => p.mode === 'inperson') || inpersonDays.length);

  return (
    <Reveal delay={delay}>
      <div className="group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col"
        style={{ background: 'rgba(10,18,32,0.92)', border: '1px solid rgba(255,255,255,0.07)', height: '100%' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow='0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(6,182,212,0.15)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>

        {/* Top gradient bar */}
        <div className={`h-1 bg-gradient-to-r ${grad} opacity-60 group-hover:opacity-100 transition-opacity`} />

        <div className="p-5 flex-1 flex flex-col gap-4">
          {/* Header row */}
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              {expert.profile_image
                ? <img src={expert.profile_image} alt={name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/5 group-hover:ring-cyan-500/25 transition-all" />
                : <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-lg font-bold text-white shadow-lg`}>
                    {initials}
                  </div>
              }
              {expert.is_active !== false && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-emerald-400"
                  style={{ borderColor: 'rgba(10,18,32,0.92)' }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-white leading-tight truncate">{name}</h3>
              {specs.length > 0 && (
                <p className="text-xs mt-0.5 truncate font-medium" style={{ color: '#22d3ee' }}>
                  {specs.join(' · ')}
                </p>
              )}
              {expert.experience_years && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Award className="w-3 h-3 flex-shrink-0" style={{ color: '#475569' }} />
                  <span className="text-[11px]" style={{ color: '#64748b' }}>
                    {expert.experience_years}+ yrs experience
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {expert.bio && (
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#64748b' }}>{expert.bio}</p>
          )}

          {/* Availability days */}
          {allDays.length > 0 && (
            <div className="flex gap-1">
              {DAY_SHORT.map((d, i) => {
                const active = allDays.includes(i);
                return (
                  <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                    style={{
                      background: active ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.025)',
                      color:      active ? '#22d3ee' : '#1e3050',
                      border:     `1px solid ${active ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.04)'}`,
                    }}>{d}
                  </div>
                );
              })}
            </div>
          )}

          {/* Session modes */}
          <div className="flex gap-2 flex-wrap">
            {hasOnline && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                <Video className="w-3 h-3" /> Online{expert.online_price ? ` · ₹${expert.online_price}` : ''}
              </span>
            )}
            {hasInPerson && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                <MapPin className="w-3 h-3" /> In-Person{expert.inperson_price ? ` · ₹${expert.inperson_price}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,14,26,0.5)' }}>
          <div>
            {minPrice < Infinity ? (
              <>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#1e3050' }}>from</p>
                <p className="text-xl font-bold text-white leading-none mt-0.5">₹{minPrice}</p>
              </>
            ) : (
              <p className="text-xs" style={{ color: '#475569' }}>Contact for pricing</p>
            )}
          </div>
          <Link to="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 group-hover:gap-3"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 16px rgba(6,182,212,0.25)' }}
            onClick={e => e.stopPropagation()}>
            Book Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const Home: React.FC = () => {
  const [experts,  setExperts]  = useState<Expert[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [cat,      setCat]      = useState('All');
  const [navOpen,  setNavOpen]  = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expertService.getAll(1, 50);
      // API returns { success, data: { experts, pagination } }
      setExperts(res.data?.experts || res.data || []);
    } catch { setExperts([]); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = experts.filter(e => {
    const nm = (e.full_name || '').toLowerCase();
    const sp = (e.specializations || []).join(' ').toLowerCase();
    const q  = search.toLowerCase();
    return (!q || nm.includes(q) || sp.includes(q)) &&
      (cat === 'All' || sp.includes(cat.toLowerCase()));
  });

  return (
    <div style={{ backgroundColor: '#07111e', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ── Announcement bar ───────────────────────────────────────── */}
      <div className="py-2.5 text-center text-xs font-semibold"
        style={{ background: 'linear-gradient(90deg, #0891b2, #6366f1, #0891b2)', backgroundSize: '200%', animation: 'shiftBg 10s linear infinite', color: '#fff', letterSpacing: '0.02em' }}>
        🧠 Use&nbsp;<span className="font-black bg-white/20 px-1.5 py-0.5 rounded-md">MIND15</span>&nbsp;for 15% off your first session &nbsp;·&nbsp; Same-day appointments available
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(7,17,30,0.97)' : 'rgba(7,17,30,0.8)',
          backdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid rgba(6,182,212,0.12)' : '1px solid rgba(255,255,255,0.04)',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-10 py-4">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-[15px] font-bold text-white block">Nila Healthcare</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest block mt-0.5" style={{ color: '#334155' }}>Mental Wellness</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {[['#therapists','Find Therapist'],['#why','Why Nila'],['#how','How It Works']].map(([href, label]) => (
              <a key={label} href={href}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>
                {label}
              </a>
            ))}
            <Link to="/about" className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>
              About
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'; }}>
              Sign In
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 18px rgba(6,182,212,0.35)' }}>
              Book Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
            onClick={() => setNavOpen(o => !o)}>
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <div className="md:hidden px-5 pb-5 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="pt-3 space-y-0.5">
              {[['#therapists','Find Therapist'],['#why','Why Nila'],['#how','How It Works']].map(([href, label]) => (
                <a key={label} href={href} onClick={() => setNavOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#94a3b8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#64748b'}>
                  {label}
                </a>
              ))}
              <Link to="/about" onClick={() => setNavOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm" style={{ color: '#64748b' }}>
                About
              </Link>
            </div>
            <Link to="/login" onClick={() => setNavOpen(false)}
              className="block mt-3 text-center py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
              Book a Session
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24 px-5">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
            style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px]"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.8) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          {/* Floating orbs */}
          <div className="absolute top-24 right-[10%] w-72 h-72 rounded-full opacity-[0.07] blur-3xl animate-pulse"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', animationDuration: '6s' }} />
          <div className="absolute bottom-12 left-[5%] w-56 h-56 rounded-full opacity-[0.06] blur-3xl animate-pulse"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', animationDuration: '9s', animationDelay: '3s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 text-xs font-bold uppercase tracking-wider"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified Mental Health Professionals · India's #1 Platform
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6" style={{ letterSpacing: '-0.03em' }}>
              Find Care That Truly{' '}
              <span className="relative inline-block">
                <span style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 55%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Understands You
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)' }} />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#64748b' }}>
              Connect with licensed therapists, psychologists & counselors. Online or in-person — your choice, your pace. Same-day appointments available across India.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }} />
              <div className="relative flex items-center rounded-2xl overflow-hidden"
                style={{ background: 'rgba(10,18,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <Search className="ml-5 w-5 h-5 flex-shrink-0" style={{ color: '#334155' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, issue, or specialization..."
                  className="flex-1 pl-4 pr-4 py-4 text-sm bg-transparent focus:outline-none"
                  style={{ color: '#f1f5f9' }} />
                <div className="pr-3">
                  <a href="#therapists"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 16px rgba(6,182,212,0.3)' }}>
                    Search
                  </a>
                </div>
              </div>
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {['Anxiety','Depression','Relationships','Stress','Trauma','OCD'].map(tag => (
                <button key={tag} onClick={() => setSearch(tag)}
                  className="px-3 py-1.5 rounded-full transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.3)'; (e.currentTarget as HTMLElement).style.color='#22d3ee'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='#475569'; }}>
                  {tag}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-14">
          <a href="#therapists" className="flex flex-col items-center gap-2 animate-bounce" style={{ color: '#1e3050' }}>
            <span className="text-[10px] uppercase tracking-widest font-semibold">Browse Experts</span>
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────── */}
      <Reveal>
        <div style={{ background: 'rgba(9,17,32,0.7)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5 px-6 py-8 text-center">
            {[
              { v: '10,000+', l: 'Patients Helped', icon: Users },
              { v: '50+',     l: 'Verified Experts', icon: Shield },
              { v: '4.9 ★',  l: 'Average Rating',   icon: Star },
              { v: '< 2 min', l: 'Booking Time',    icon: Zap },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.l}>
                  <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: '#0e7490' }} />
                  <p className="text-2xl font-bold mb-1 text-white">{s.v}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#334155' }}>{s.l}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ── Therapist directory ────────────────────────────────────── */}
      <section id="therapists" className="px-5 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.22em] mb-2" style={{ color: '#06b6d4' }}>Our Experts</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Browse Therapists</h2>
            </div>
          </Reveal>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-7">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-200"
                style={{
                  background: cat === c ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'rgba(10,18,32,0.9)',
                  color:      cat === c ? '#fff' : '#475569',
                  border:     `1px solid ${cat === c ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow:  cat === c ? '0 4px 16px rgba(6,182,212,0.3)' : 'none',
                }}>
                {c}
              </button>
            ))}
            <button onClick={load}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all"
              style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)', color: '#334155' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#64748b'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#334155'}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Count */}
          {!loading && (
            <p className="text-sm mb-6 font-medium" style={{ color: '#1e3050' }}>
              {filtered.length} expert{filtered.length !== 1 ? 's' : ''} available
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(6,182,212,0.15)', borderTopColor: '#06b6d4' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#1e3050' }}>Finding your perfect therapist…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Search className="w-9 h-9 opacity-15" />
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: '#334155' }}>No experts found</p>
              <p className="text-sm" style={{ color: '#1e3050' }}>Try a different search term or category</p>
              <button onClick={() => { setSearch(''); setCat('All'); }}
                className="mt-6 px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((expert, i) => (
                <TherapistCard key={expert.id} expert={expert} delay={Math.min(i * 0.04, 0.3)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Nila ───────────────────────────────────────────────── */}
      <section id="why" className="px-5 py-20 sm:py-28"
        style={{ background: 'rgba(8,15,28,0.6)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: '#06b6d4' }}>Why Choose Nila</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>
                Care that fits <em className="not-italic" style={{ color: '#22d3ee' }}>your</em> life
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield,       color: '#22d3ee', title: 'Verified Professionals',  desc: 'Every therapist is licensed, background-verified, and peer-reviewed by our clinical board before joining Nila.' },
              { icon: Video,        color: '#818cf8', title: 'Online & In-Person',      desc: 'Secure video sessions from home or visit a clinic near you. Maximum flexibility, zero compromise on quality.' },
              { icon: Lock,         color: '#34d399', title: '100% Confidential',       desc: 'Your privacy is our highest priority. All sessions are encrypted. No data is ever shared.' },
              { icon: TrendingUp,   color: '#fbbf24', title: 'Track Your Progress',     desc: 'Your personal portal tracks sessions, milestones, and notes so you can see real growth over time.' },
            ].map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={w.title} delay={i * 0.08}>
                  <div className="p-6 rounded-3xl h-full transition-all duration-300 cursor-default"
                    style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=w.color+'35'; (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 16px 40px rgba(0,0,0,0.3)`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: w.color+'15', border: `1px solid ${w.color}25` }}>
                      <Icon className="w-5 h-5" style={{ color: w.color }} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2.5">{w.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{w.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" className="px-5 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: '#06b6d4' }}>Simple Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>
                3 steps to your first session
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-10 left-[calc(16%+1rem)] right-[calc(16%+1rem)] h-px"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.4) 20%, rgba(6,182,212,0.4) 80%, transparent 100%)' }} />

            {[
              { n: '01', icon: Search,   title: 'Browse & Filter',     desc: 'Search by specialization, availability, session type, and price. Read profiles to find your match.' },
              { n: '02', icon: Calendar, title: 'Pick Your Slot',      desc: 'Choose a date, time, and whether you want an online video call or in-person clinic visit.' },
              { n: '03', icon: Heart,    title: 'Begin Your Journey',  desc: 'Confirm, pay securely, and attend your session. Your healing journey starts here.' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.n} delay={i * 0.1}>
                  <div className="text-center p-8 rounded-3xl relative"
                    style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10"
                      style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(59,130,246,0.1))', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <Icon className="w-6 h-6" style={{ color: '#22d3ee' }} />
                    </div>
                    <span className="text-4xl font-black mb-3 block" style={{ color: 'rgba(6,182,212,0.08)', letterSpacing: '-0.04em' }}>{step.n}</span>
                    <h3 className="text-sm font-bold text-white mb-2.5 -mt-2">{step.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{step.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <Reveal>
        <div className="px-5 pb-24">
          <div className="max-w-3xl mx-auto text-center p-12 sm:p-16 rounded-3xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(59,130,246,0.06) 50%, rgba(124,58,237,0.06) 100%)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                <Sparkles className="w-3.5 h-3.5" /> Free first consultation for new users
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.025em' }}>
                Take the first step today
              </h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: '#64748b' }}>
                Join 10,000+ people who found their path to better mental health with Nila. You deserve care that works.
              </p>
              <Link to="/login"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 8px 32px rgba(6,182,212,0.4)' }}>
                Book Your Session <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="px-6 py-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Nila Healthcare</span>
              </div>
              <p className="text-xs max-w-xs" style={{ color: '#1e3050', lineHeight: '1.7' }}>
                India's trusted mental health platform. Connecting people with verified professionals since 2024.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs" style={{ color: '#1e3050' }}>
              {[
                { label: 'Find Therapist', href: '#therapists' },
                { label: 'About Us', href: '/about' },
                { label: 'How It Works', href: '#how' },
                { label: 'Patient Login', href: '/login' },
                { label: 'Why Nila', href: '#why' },
                { label: 'Admin Portal', href: '/login' },
              ].map(l => (
                l.href.startsWith('#')
                  ? <a key={l.label} href={l.href} className="hover:text-slate-400 transition-colors">{l.label}</a>
                  : <Link key={l.label} to={l.href} className="hover:text-slate-400 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <p className="text-xs" style={{ color: '#0d1928' }}>
              © 2025 Nila Healthcare · Built with care in India
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#0d1928' }}>
              <Lock className="w-3 h-3" /> Your data is encrypted and secure
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shiftBg {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Home;
