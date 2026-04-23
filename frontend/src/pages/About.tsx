import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, Heart, Shield, Users, Target,
  Award, Globe, Mail, CheckCircle, Sparkles, BookOpen,
  Handshake, ChevronLeft, Brain, Smile, Lock, Zap, Star
} from 'lucide-react';

function useInView(t = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: t });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const { ref, visible } = useInView();
  return <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(26px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s` }}>{children}</div>;
};

const VALUES = [
  { icon: Heart, color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)', title: 'Compassion First', desc: 'Every decision starts with empathy. Each patient\'s journey is treated with the care it deserves.' },
  { icon: Lock, color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', title: 'Privacy & Safety', desc: 'End-to-end encrypted. Sessions are confidential. Trust is non-negotiable — always.' },
  { icon: Award, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)', title: 'Clinical Excellence', desc: 'Our experts meet rigorous licensing standards and undergo continuous peer education reviews.' },
  { icon: Globe, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', title: 'Accessibility', desc: 'Mental healthcare for everyone — regardless of location, language, or background.' },
  { icon: Smile, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', title: 'Stigma-Free', desc: 'We actively fight stigma through education, language, and how we design every experience.' },
  { icon: Zap, color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)', title: 'Speed & Access', desc: 'Same-day appointments. No waitlists. Because mental health can\'t always wait.' },
];

const MILESTONES = [
  { year: '2022', event: 'Founded in Chennai with a mission to make mental healthcare accessible across Tamil Nadu.', color: '#06b6d4' },
  { year: '2023', event: 'Expanded to 5 cities, onboarded 25 licensed mental health professionals across South India.', color: '#a78bfa' },
  { year: '2024', event: 'Launched secure online video session platform and mobile booking. Reached 5,000 patients served.', color: '#34d399' },
  { year: '2025', event: 'Crossed 10,000 patients and 50+ verified experts. Launched Patient Progress Dashboard.', color: '#fbbf24' },
];

const TEAM = [
  { name: 'Dr. Kavitha Rajan', role: 'Chief Medical Officer', initials: 'KR', color: '#06b6d4', bio: 'Psychiatrist with 15+ years in clinical practice and mental health policy.' },
  { name: 'Arjun Mehta', role: 'CEO & Co-founder', initials: 'AM', color: '#a78bfa', bio: 'Former healthtech executive passionate about democratizing mental healthcare in India.' },
  { name: 'Dr. Preethi S.', role: 'Head of Clinical Standards', initials: 'PS', color: '#34d399', bio: 'Clinical psychologist and researcher specializing in evidence-based therapy approaches.' },
  { name: 'Riya Nair', role: 'Head of Patient Experience', initials: 'RN', color: '#fbbf24', bio: 'UX researcher dedicated to making mental healthcare feel welcoming and stigma-free.' },
];

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Software Engineer, Chennai', text: 'Nila made it incredibly easy to find the right therapist. I booked my first online session in minutes and have never looked back.', stars: 5 },
  { name: 'Arun K.', role: 'Teacher, Coimbatore', text: 'The in-person booking was seamless. My psychiatrist is wonderful, and the platform keeps all my session history organized.', stars: 5 },
  { name: 'Meena R.', role: 'Student, Bangalore', text: 'I was nervous about therapy but Nila made it feel approachable. The video sessions fit perfectly into my schedule.', stars: 5 },
];

const About: React.FC = () => {
  const [activeTesti, setActiveTesti] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveTesti(a => (a + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ backgroundColor: '#070e1a', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50" style={{ background: 'rgba(7,14,26,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-10 py-4">
          <Link to="/home" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 18px rgba(6,182,212,0.4)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Nila Healthcare</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/home" className="hidden sm:flex items-center gap-1 text-sm transition-colors" style={{ color: '#64748b' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#64748b'}>
              <ChevronLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Link to="/book" className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 16px rgba(6,182,212,0.3)' }}>
              Book a Session <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-5 pt-20 pb-20 sm:pt-28 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px]" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px]" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)', transform: 'translate(-30%, 30%)' }} />
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              <Sparkles className="w-3.5 h-3.5" /> Our Story
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <FadeIn delay={0.08}>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                  Built on the belief that
                  <span className="block" style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    mental health is a right
                  </span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.15}>
                <p className="text-base leading-relaxed mb-8" style={{ color: '#64748b' }}>
                  Nila Healthcare was founded by clinicians and technologists who saw a painful gap: millions of people in India struggle to access quality mental health support. We built the platform we wished existed — one that respects your time, privacy, and dignity.
                </p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="space-y-3">
                  {[
                    'Transparent, affordable pricing — no surprises',
                    'All experts licensed and continuously peer-reviewed',
                    'Available in English, Tamil, and Hindi',
                    'No waitlists — book and start within days',
                  ].map(p => (
                    <div key={p} className="flex items-start gap-3 text-sm" style={{ color: '#94a3b8' }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }} />
                      {p}
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, value: '50+', label: 'Verified Experts', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
                  { icon: BookOpen, value: '10K+', label: 'Sessions Done', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
                  { icon: Target, value: '5+', label: 'Cities Served', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
                  { icon: Handshake, value: '98%', label: 'Satisfaction', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="p-5 rounded-2xl text-center transition-all duration-300"
                      style={{ background: 'rgba(11,19,34,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs mt-1" style={{ color: '#334155' }}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-5 py-20" style={{ background: 'rgba(9,17,32,0.7)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-10 items-center">
          <FadeIn>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#a78bfa' }}>Our Mission</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5" style={{ letterSpacing: '-0.02em' }}>
                Removing every barrier between you and care
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                We believe geography, stigma, and cost should never stop anyone from getting the mental health support they need. Nila combines clinical rigor with a seamless digital experience to make expert care as easy as ordering dinner.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="p-8 rounded-3xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.25)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)', transform: 'translate(30%,-30%)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }}>
                  <Target className="w-6 h-6" style={{ color: '#a78bfa' }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a78bfa' }}>Our Vision</p>
                <p className="text-lg font-bold text-white mb-4" style={{ lineHeight: '1.55' }}>
                  A future where every person in India has access to quality mental healthcare within 24 hours.
                </p>
                <p className="text-sm" style={{ color: '#475569' }}>
                  We're not just building a product — we're building the infrastructure for a mentally healthier India.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <FadeIn><div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#06b6d4' }}>Our Values</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>What we stand for</h2>
          </div></FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <FadeIn key={v.title} delay={i * 0.08}>
                  <div className="p-6 rounded-3xl h-full transition-all duration-300"
                    style={{ background: 'rgba(11,19,34,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = v.border; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: v.bg, border: `1px solid ${v.border}` }}>
                      <Icon className="w-5 h-5" style={{ color: v.color }} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{v.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{v.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-5 py-20" style={{ background: 'rgba(9,17,32,0.7)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-3xl mx-auto">
          <FadeIn><div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#06b6d4' }}>Our Journey</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Milestones that matter</h2>
          </div></FadeIn>
          <div className="relative">
            <div className="absolute left-11 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.3), transparent)' }} />
            <div className="space-y-6">
              {MILESTONES.map((m, i) => (
                <FadeIn key={m.year} delay={i * 0.1}>
                  <div className="flex items-stretch gap-5">
                    <div className="w-[88px] flex-shrink-0">
                      <div className="w-[88px] h-[88px] rounded-2xl flex items-center justify-center font-bold text-sm z-10 relative"
                        style={{ background: `linear-gradient(135deg, ${m.color}25, ${m.color}10)`, border: `1px solid ${m.color}40`, color: m.color }}>
                        {m.year}
                      </div>
                    </div>
                    <div className="flex-1 py-5 px-5 rounded-2xl self-center"
                      style={{ background: 'rgba(11,19,34,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{m.event}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-5 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <FadeIn><div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#06b6d4' }}>The People</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Meet our leadership</h2>
            <p className="text-sm" style={{ color: '#475569' }}>Clinicians and technologists united by one mission.</p>
          </div></FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((member, i) => (
              <FadeIn key={member.name} delay={i * 0.1}>
                <div className="p-6 rounded-3xl text-center transition-all duration-300"
                  style={{ background: 'rgba(11,19,34,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = member.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-base font-bold"
                    style={{ background: `linear-gradient(135deg, ${member.color}30, ${member.color}15)`, border: `1px solid ${member.color}40`, color: member.color }}>
                    {member.initials}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{member.name}</h3>
                  <p className="text-xs mb-3" style={{ color: member.color }}>{member.role}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{member.bio}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 py-20" style={{ background: 'rgba(9,17,32,0.7)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#06b6d4' }}>Patient Stories</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12" style={{ letterSpacing: '-0.02em' }}>Real people, real results</h2>

            <div className="relative p-8 rounded-3xl mb-6 overflow-hidden"
              style={{ background: 'rgba(11,19,34,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)', transform: 'translate(30%,-30%)' }} />
              <div className="relative">
                <div className="flex justify-center gap-1 mb-5">
                  {[...Array(TESTIMONIALS[activeTesti].stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                  ))}
                </div>
                <p className="text-base sm:text-lg text-white leading-relaxed mb-6" style={{ fontStyle: 'italic' }}>
                  "{TESTIMONIALS[activeTesti].text}"
                </p>
                <p className="text-sm font-bold text-white">{TESTIMONIALS[activeTesti].name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{TESTIMONIALS[activeTesti].role}</p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActiveTesti(i)} className="rounded-full transition-all"
                  style={{ width: i === activeTesti ? '24px' : '8px', height: '8px', background: i === activeTesti ? '#06b6d4' : 'rgba(255,255,255,0.12)' }} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <FadeIn>
        <div className="px-5 py-20">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.08))', border: '1px solid rgba(6,182,212,0.2)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.07), transparent 65%)' }} />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>Join us on this journey</h2>
              <p className="text-sm mb-8" style={{ color: '#64748b' }}>
                Whether you're a patient seeking support or a clinician wanting to make a difference — we'd love to have you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/book" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 24px rgba(6,182,212,0.35)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform='translateY(0)'}>
                  Book a Session <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="mailto:hello@nilahealthcare.com" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-medium transition-all"
                  style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.25)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'; }}>
                  <Mail className="w-4 h-4" /> Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto text-center text-xs" style={{ color: '#0d1928' }}>
          © 2025 Nila Healthcare · Built with care in Chennai, India
        </div>
      </footer>
    </div>
  );
};

export default About;
