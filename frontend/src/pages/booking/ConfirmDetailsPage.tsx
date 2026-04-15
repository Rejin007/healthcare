import React from 'react';
import {
  ChevronLeft, ChevronRight, Video, MapPin, Clock, Calendar,
  User, Phone, Mail, AlertCircle, IndianRupee, Stethoscope
} from 'lucide-react';
import { Expert } from '../../types';
import { SessionDetails } from './SessionDetailsPage';
import { avatarGrad, initials } from '../../styles/theme';

interface Props {
  expert:  Expert;
  session: SessionDetails;
  user:    any;
  onBack:  () => void;
  onNext:  () => void;
}

function parseDateTime(timeStr: string, dateStr?: string): Date | null {
  if (!timeStr) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(timeStr)) return new Date(timeStr);
  if (/^\d{2}:\d{2}/.test(timeStr) && dateStr) return new Date(`${dateStr}T${timeStr}`);
  return new Date(timeStr);
}

const Row: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-3" style={{ borderBottom:'1px solid var(--border-faint)' }}>
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background:'var(--bg-elevated)' }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>{label}</p>
      <div className="text-sm font-medium mt-0.5" style={{ color:'var(--text-primary)' }}>{value}</div>
    </div>
  </div>
);

const ConfirmDetailsPage: React.FC<Props> = ({ expert, session, user, onBack, onNext }) => {
  const startDt = parseDateTime(session.startTime, session.date);
  const endDt   = parseDateTime(session.endTime,   session.date);

  const fmtDate = (dt: Date | null) =>
    dt ? dt.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : session.date;
  const fmtTime = (dt: Date | null, fallback: string) =>
    dt ? dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }) : fallback;

  const isOnline = session.mode === 'online';
  const grad     = avatarGrad(expert.full_name || 'Dr');
  const init     = initials(expert.full_name || 'Dr');

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor:'var(--bg-deep)', color:'var(--text-primary)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur-sm px-4 py-3"
        style={{ background:'rgba(7,14,26,0.95)', borderBottom:'1px solid var(--border-faint)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl transition-colors"
            style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Step 3 of 4</p>
            <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Confirm Details</p>
          </div>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {[1,2,3,4].map(s => (
              <div key={s} className="h-2 rounded-full transition-all"
                style={{
                  width:      s === 3 ? '20px' : '8px',
                  background: s <= 3  ? 'var(--primary)' : 'var(--border-medium)',
                }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Expert card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>
          <div className="h-0.5" style={{ background: grad }} />
          <div className="p-5 flex items-center gap-4">
            {expert.profile_image
              ? <img src={expert.profile_image} alt={expert.full_name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
              : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                  style={{ background: grad }}>{init}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold" style={{ color:'var(--text-primary)' }}>{expert.full_name}</p>
              {expert.specializations?.[0] && (
                <p className="text-xs font-semibold mt-0.5" style={{ color:'var(--text-accent)' }}>
                  {expert.specializations.slice(0,2).join(' · ')}
                </p>
              )}
              {expert.experience_years && (
                <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
                  {expert.experience_years}+ years experience
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{
                  background: isOnline ? 'rgba(59,130,246,0.10)' : 'rgba(16,185,129,0.10)',
                  color:      isOnline ? '#60a5fa' : '#34d399',
                  border:     `1px solid ${isOnline ? 'rgba(59,130,246,0.28)' : 'rgba(16,185,129,0.28)'}`,
                }}>
                {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {isOnline ? 'Online' : 'In-Person'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Session Details ──────────────────────────────────────────── */}
        <div className="rounded-2xl px-5 py-1"
          style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>
          <Row
            icon={<Calendar className="w-4 h-4" style={{ color:'var(--primary)' }} />}
            label="Date"
            value={fmtDate(startDt)}
          />
          <Row
            icon={<Clock className="w-4 h-4" style={{ color:'var(--warning)' }} />}
            label="Time"
            value={`${fmtTime(startDt, session.slotLabel)} – ${fmtTime(endDt, '')}`}
          />
          <Row
            icon={isOnline
              ? <Video className="w-4 h-4" style={{ color:'#60a5fa' }} />
              : <MapPin className="w-4 h-4" style={{ color:'#34d399' }} />}
            label="Session Type"
            value={isOnline ? 'Online – Video Call' : 'In-Person – Clinic Visit'}
          />
          <div className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'var(--bg-elevated)' }}>
              <IndianRupee className="w-4 h-4" style={{ color:'var(--success)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Amount Due</p>
              <p className="text-lg font-bold mt-0.5" style={{ color:'var(--text-primary)' }}>
                {session.price > 0 ? `₹${session.price}` : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Patient Info ─────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'var(--text-muted)' }}>
            Your Details
          </p>
          <div className="rounded-2xl px-5 py-1"
            style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>
            <Row
              icon={<User className="w-4 h-4" style={{ color:'var(--secondary-light)' }} />}
              label="Name"
              value={user?.full_name || 'Not set'}
            />
            <Row
              icon={<Phone className="w-4 h-4" style={{ color:'var(--info)' }} />}
              label="Phone"
              value={user?.phone || '—'}
            />
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'var(--bg-elevated)' }}>
                <Mail className="w-4 h-4" style={{ color:'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Email</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: user?.email ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {user?.email || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notice ───────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background:'rgba(6,182,212,0.06)', border:'1px solid var(--border-accent)' }}>
          <Stethoscope className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:'var(--primary)' }} />
          <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>
            Please review your session details carefully before proceeding to payment.
            {isOnline
              ? ' A Google Meet link will be sent to you shortly after confirmation.'
              : ' Please arrive 10 minutes early at the clinic.'}
          </p>
        </div>
      </div>

      {/* ── Fixed bottom CTA ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background:'rgba(7,14,26,0.97)', borderTop:'1px solid var(--border-faint)', backdropFilter:'blur(16px)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={onNext}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
            style={{ background:'linear-gradient(135deg, var(--primary-dark), var(--primary))', boxShadow:'0 4px 20px var(--primary-glow)' }}>
            Proceed to Payment
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDetailsPage;
