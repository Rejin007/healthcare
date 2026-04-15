import React, { useEffect, useState } from 'react';
import {
  CheckCircle, Calendar, Clock, Video, MapPin,
  Home, IndianRupee, Stethoscope, Sparkles, PartyPopper
} from 'lucide-react';
import { Expert } from '../../types';
import { SessionDetails } from './SessionDetailsPage';
import { avatarGrad, initials } from '../../styles/theme';

interface Props {
  expert:          Expert;
  session:         SessionDetails;
  appointmentId:   string;
  onViewDashboard: () => void;
  onBookAnother:   () => void;
}

const BookingSuccessPage: React.FC<Props> = ({
  expert, session, appointmentId, onViewDashboard, onBookAnother
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const startDt = new Date(session.startTime);
  const endDt   = new Date(session.endTime);
  const isOnline = session.mode === 'online';
  const grad     = avatarGrad(expert.full_name || 'Dr');
  const init     = initials(expert.full_name || 'Dr');

  const fmtDate = (dt: Date) =>
    dt.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const fmtTime = (dt: Date) =>
    dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });

  const anim = (delay = 0) => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor:'var(--bg-deep)', color:'var(--text-primary)' }}>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ overflow:'hidden' }}>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-8"
          style={{ background:'radial-gradient(circle, var(--success) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md">

        {/* ── Success icon ──────────────────────────────────────────── */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center glow-success"
              style={{
                background:  'var(--success-glow)',
                border:      '2px solid var(--success)',
                opacity:     visible ? 1 : 0,
                transform:   visible ? 'scale(1)' : 'scale(0.5)',
                transition:  'transform 0.5s cubic-bezier(.175,.885,.32,1.275), opacity 0.4s ease',
              }}>
              <CheckCircle className="w-10 h-10" style={{ color:'var(--success)' }} />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background:  'var(--warning)',
                opacity:     visible ? 1 : 0,
                transform:   visible ? 'scale(1)' : 'scale(0)',
                transition:  'all 0.4s cubic-bezier(.175,.885,.32,1.275) 0.3s',
              }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* ── Heading ───────────────────────────────────────────────── */}
        <div className="text-center mb-8" style={anim(0.15)}>
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color:'var(--text-primary)' }}>
            Booking Confirmed! <PartyPopper className="w-6 h-6" style={{ color:'var(--success)' }} />
          </h1>
          <p className="text-sm" style={{ color:'var(--text-secondary)' }}>
            Your appointment has been successfully booked.
            {isOnline
              ? " You'll receive a Google Meet link shortly."
              : " See you at the clinic!"}
          </p>
        </div>

        {/* ── Appointment card ──────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ ...anim(0.3), background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>

          {/* Booking ID bar */}
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-faint)' }}>
            <span className="text-xs" style={{ color:'var(--text-muted)' }}>Booking ID</span>
            <span className="text-xs font-mono font-semibold" style={{ color:'var(--primary-light)' }}>
              #{appointmentId.slice(0,8).toUpperCase()}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Clinician */}
            <div className="flex items-center gap-3">
              {expert.profile_image
                ? <img src={expert.profile_image} alt={expert.full_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: grad }}>{init}</div>
              }
              <div>
                <p className="text-sm font-bold" style={{ color:'var(--text-primary)' }}>{expert.full_name}</p>
                {expert.specializations?.[0] && (
                  <p className="text-xs" style={{ color:'var(--text-accent)' }}>{expert.specializations[0]}</p>
                )}
              </div>
            </div>

            <div style={{ height:'1px', background:'var(--border-faint)' }} />

            {/* Details */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color:'var(--primary)' }} />
                <span className="text-sm" style={{ color:'var(--text-secondary)' }}>{fmtDate(startDt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color:'var(--warning)' }} />
                <span className="text-sm" style={{ color:'var(--text-secondary)' }}>
                  {fmtTime(startDt)} – {fmtTime(endDt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isOnline
                  ? <Video className="w-4 h-4 flex-shrink-0" style={{ color:'#60a5fa' }} />
                  : <MapPin className="w-4 h-4 flex-shrink-0" style={{ color:'#34d399' }} />}
                <span className="text-sm" style={{ color: isOnline ? '#60a5fa' : '#34d399' }}>
                  {isOnline ? 'Online – Video Call' : 'In-Person – Clinic Visit'}
                </span>
              </div>
              {session.price > 0 && (
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-4 h-4 flex-shrink-0" style={{ color:'var(--success)' }} />
                  <span className="text-sm" style={{ color:'var(--success)' }}>
                    ₹{session.price} — Payment successful
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="px-5 py-3 flex items-center justify-center gap-2"
            style={{ background:'var(--success-glow)', borderTop:'1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle className="w-4 h-4" style={{ color:'var(--success)' }} />
            <span className="text-sm font-semibold" style={{ color:'var(--success)' }}>Appointment Confirmed</span>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="space-y-3" style={anim(0.5)}>
          <button onClick={onViewDashboard}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
            style={{ background:'linear-gradient(135deg, var(--primary-dark), var(--primary))', boxShadow:'0 4px 20px var(--primary-glow)' }}>
            <Home className="w-4 h-4" /> View My Appointments
          </button>
          <button onClick={onBookAnother}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all"
            style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-secondary)' }}>
            <Stethoscope className="w-4 h-4" /> Book Another Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
