import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, Heart, Shield, Users, Calendar,
  Star, CheckCircle, Zap, Brain, Phone, Mail, MapPin,
  ChevronRight, Play, Clock, Video, Award, Lock
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function useInView(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: t });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ''
}) => {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`
    }}>
      {children}
    </div>
  );
};

/* ── Data ────────────────────────────────────────────────────────────────── */
const STATS = [
  { value: '10,000+', label: 'Patients Served', icon: Users, color: '#06b6d4' },
  { value: '50+',     label: 'Expert Clinicians', icon: Award, color: '#a78bfa' },
  { value: '98%',     label: 'Satisfaction Rate', icon: Star, color: '#34d399' },
  { value: '<24h',    label: 'Avg Booking Time', icon: Clock, color: '#fbbf24' },
];

const SERVICES = [
  {
    icon: Brain, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)',
    title: 'Psychiatry',
    desc: 'Board-certified psychiatrists for diagnosis, medication management, and comprehensive mental health care.',
    features: ['ADHD & Depression', 'Medication Reviews', 'Crisis Support'],
  },
  {
    icon: Heart, color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)',
    title: 'Therapy & Counselling',
    desc: 'Licensed therapists using CBT, DBT, and other evidence-based approaches for lasting wellbeing.',
    features: ['Individual Therapy', 'Couples & Family', 'Trauma & PTSD'],
  },
  {
    icon: Video, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)',
    title: 'Online Sessions',
    desc: 'Secure, encrypted video sessions from anywhere. Same-day slots available — no waitlists.',
    features: ['HD Video Calls', 'Mobile & Desktop', 'Session Recordings'],
  },
  {
    icon: Shield, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)',
    title: 'In-Person Clinics',
    desc: 'Comfortable, private clinic visits across Tamil Nadu with top-rated clinicians near you.',
    features: ['Private Rooms', 'Multiple Cities', 'Walk-in Available'],
  },
];

const HOW_STEPS = [
  {
    num: '01', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)',
    title: 'Book in Minutes',
    desc: 'Choose your preferred clinician, session type, and time slot — no paperwork, no wait.',
  },
  {
    num: '02', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)',
    title: 'Meet Your Expert',
    desc: 'Connect via secure video or visit the clinic. Your session is private and fully encrypted.',
  },
  {
    num: '03', color: '#34d399', glow: 'rgba(52,211,153,0.3)',
    title: 'Track Your Progress',
    desc: 'View session history, notes, and care plans on your personal patient dashboard.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya S.', role: 'Software Engineer, Chennai', stars: 5,
    text: 'Nila made it incredibly easy to find the right therapist. Booked my first session in minutes and the platform keeps everything organised.',
  },
  {
    name: 'Arun K.', role: 'Teacher, Coimbatore', stars: 5,
    text: 'The in-person booking was seamless and my psychiatrist is wonderful. I finally feel like I have proper support.',
  },
  {
    name: 'Meena R.', role: 'Student, Bangalore', stars: 5,
    text: 'I was nervous about therapy but Nila made it approachable. The video sessions fit perfectly into my schedule.',
  },
];

/* ── Component ───────────────────────────────────────────────────────────── */
const Home: React.FC = () => {
  const [activeTesti, setActiveTesti] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTesti(a => (a + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const BG = '#070e1a';
  const SURFACE = 'rgba(255,255,255,0.03)';
  const BORDER = 'rgba(255,255,255,0.07)';

  return (
    <div style={{ backgroundColor: BG, color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50" style={{ background: 'rgba(7,14,26,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-10 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 18px rgba(6,182,212,0.4)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">Nila Healthcare</span>
              <p className="text-[10px] leading-none" style={{ color: '#475569' }}>Mental Wellness Platform</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[['Services', '#services'], ['How It Works', '#how'], ['About', '/about']].map(([label, href]) => (
              href.startsWith('#')
                ? <a key={label} href={href} className="text-sm font-medium transition-colors" style={{ color: '#64748b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>{label}</a>
                : <Link key={label} to={href} className="text-sm font-medium transition-colors" style={{ color: '#64748b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>{label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium px-4 py-2 rounded-xl border transition-all" style={{ color: '#94a3b8', borderColor: BORDER }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
              Sign In
            </Link>
            <Link to="/book" className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 16px rgba(6,182,212,0.3)' }}>
              Book Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 px-5 sm:px-10 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'rgba(6,182,212,0.07)' }} />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(124,58,237,0.07)' }} />
        </div>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: `linear-gradient(rgba(99,179,237,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.07) 1px, transparent 1px)`,
          backgroundSize: '44px 44px'
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
            <Zap className="w-3 h-3" /> Same-day appointments available
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
            Mental Healthcare{' '}
            <span style={{ background: 'linear-gradient(135deg, #06b6d4, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Made Simple
            </span>
          </h1>

          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#64748b' }}>
            Connect with licensed psychiatrists and therapists across Tamil Nadu. 
            Book online or in-person sessions — same day, no waitlists, fully confidential.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/book" className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 8px 32px rgba(6,182,212,0.4)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              <Calendar className="w-5 h-5" /> Book a Session
            </Link>
            <Link to="/about" className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold transition-all"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: '#94a3b8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
              <Play className="w-4 h-4" /> Learn More
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Lock, text: 'End-to-End Encrypted' },
              { icon: Shield, text: 'Licensed Professionals' },
              { icon: CheckCircle, text: 'No Hidden Fees' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: '#06b6d4' }} />
                <span className="text-sm" style={{ color: '#475569' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 sm:px-10" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon, color }, i) => (
            <FadeIn key={label} delay={i * 0.1} className="text-center">
              <div className="inline-flex p-3 rounded-2xl mb-3" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{value}</p>
              <p className="text-sm" style={{ color: '#475569' }}>{label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────────── */}
      <section id="services" className="py-24 px-5 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#06b6d4' }}>Our Services</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
              Comprehensive Mental Health Care
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Every service is delivered by vetted, licensed professionals with a focus on dignity and privacy.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(({ icon: Icon, color, bg, border, title, desc, features }, i) => (
              <FadeIn key={title} delay={i * 0.1}>
                <div className="h-full rounded-2xl p-6 transition-all duration-300 group cursor-default"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${border}`; (e.currentTarget as HTMLElement).style.background = bg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${BORDER}`; (e.currentTarget as HTMLElement).style.background = SURFACE; }}>
                  <div className="inline-flex p-3 rounded-xl mb-5" style={{ background: bg, border: `1px solid ${border}` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>{desc}</p>
                  <ul className="space-y-2">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color }} />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-5 sm:px-10" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a78bfa' }}>Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
              Start in Three Steps
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              No referrals needed. No long waits. Just easy access to the care you deserve.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_STEPS.map(({ num, color, glow, title, desc }, i) => (
              <FadeIn key={num} delay={i * 0.15}>
                <div className="relative rounded-2xl p-7" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="text-5xl font-black mb-5 leading-none" style={{ color, textShadow: `0 0 30px ${glow}`, opacity: 0.85 }}>{num}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4} className="text-center mt-12">
            <Link to="/book" className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 8px 32px rgba(6,182,212,0.35)' }}>
              Get Started Today <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#34d399' }}>Patient Stories</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              Trusted by Thousands
            </h2>
          </FadeIn>

          <FadeIn>
            <div className="rounded-3xl p-8 sm:p-10" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex gap-1 mb-6">
                {Array.from({ length: TESTIMONIALS[activeTesti].stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#fbbf24' }} />
                ))}
              </div>
              <p className="text-lg sm:text-xl font-medium text-white leading-relaxed mb-8" style={{ letterSpacing: '-0.01em' }}>
                "{TESTIMONIALS[activeTesti].text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{TESTIMONIALS[activeTesti].name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{TESTIMONIALS[activeTesti].role}</p>
                </div>
                <div className="flex gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button key={i} onClick={() => setActiveTesti(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === activeTesti ? 24 : 8, height: 8,
                        background: i === activeTesti ? '#06b6d4' : 'rgba(255,255,255,0.15)'
                      }} />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-10">
        <FadeIn>
          <div className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(124,58,237,0.12) 100%)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.12)' }} />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(124,58,237,0.12)' }} />
            <div className="relative">
              <div className="inline-flex p-4 rounded-2xl mb-6" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
                <Heart className="w-8 h-8" style={{ color: '#06b6d4' }} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
                Your Mental Health Matters
              </h2>
              <p className="text-base mb-10 max-w-lg mx-auto" style={{ color: '#64748b' }}>
                Take the first step today. Book a session with a licensed expert and begin your wellness journey.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/book" className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 8px 32px rgba(6,182,212,0.4)' }}>
                  <Calendar className="w-5 h-5" /> Book a Session
                </Link>
                <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  Sign In to Your Account
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-10 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Nila Healthcare</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                Making mental healthcare accessible, affordable, and stigma-free across Tamil Nadu.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#334155' }}>Platform</p>
              <ul className="space-y-3">
                {[['Book a Session', '/book'], ['About Us', '/about'], ['Sign In', '/login']].map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-sm transition-colors" style={{ color: '#475569' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#334155' }}>Services</p>
              <ul className="space-y-3">
                {['Psychiatry', 'Therapy', 'Online Sessions', 'In-Person Clinics'].map(s => (
                  <li key={s} className="text-sm" style={{ color: '#475569' }}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#334155' }}>Contact</p>
              <ul className="space-y-3">
                {[
                  { icon: Mail, text: 'care@nilahealthcare.in' },
                  { icon: Phone, text: '+91 98765 43210' },
                  { icon: MapPin, text: 'Chennai, Tamil Nadu' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm" style={{ color: '#475569' }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />{text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <p className="text-xs" style={{ color: '#334155' }}>© 2025 Nila Healthcare. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: '#334155' }} />
              <p className="text-xs" style={{ color: '#334155' }}>HIPAA-compliant · End-to-end encrypted</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
