import React from 'react';
import {
  ChevronLeft, ChevronRight, Video, MapPin, Clock, Calendar,
  User, Phone, Mail, AlertCircle, IndianRupee
} from 'lucide-react';
import { Expert } from '../../types';
import { SessionDetails } from './SessionDetailsPage';

interface ConfirmDetailsProps {
  expert: Expert;
  session: SessionDetails;
  user: any;
  onBack: () => void;
  onNext: () => void;
}

// Safely parse a time string that could be ISO, 'YYYY-MM-DDTHH:MM', or 'HH:MM[:SS]'
function parseDateTime(timeStr: string, dateStr?: string): Date | null {
  if (!timeStr) return null;
  // Full ISO
  if (/^\d{4}-\d{2}-\d{2}T/.test(timeStr)) return new Date(timeStr);
  // HH:MM or HH:MM:SS — combine with date
  if (/^\d{2}:\d{2}/.test(timeStr) && dateStr) return new Date(`${dateStr}T${timeStr}`);
  return new Date(timeStr);
}

const ConfirmDetailsPage: React.FC<ConfirmDetailsProps> = ({ expert, session, user, onBack, onNext }) => {
  const startDt = parseDateTime(session.startTime, session.date);
  const endDt   = parseDateTime(session.endTime,   session.date);

  const fmtDate = (dt: Date | null) =>
    dt ? dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : session.date;

  const fmtTime = (dt: Date | null, fallback: string) =>
    dt
      ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : session.slotLabel || fallback;

  const isOnline = session.mode === 'online';

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur-sm px-4 py-3"
        style={{ background: 'rgba(7,14,26,0.9)', borderBottom: '1px solid var(--border-faint)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Step 3 of 4</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Confirm Details</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="w-2 h-2 rounded-full transition-all"
                style={{ background: s <= 3 ? 'var(--primary)' : 'var(--border-medium)' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Session Summary Card ──────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>

          {/* Header banner */}
          <div className="px-5 py-4"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(124,58,237,0.06) 100%)', borderBottom: '1px solid var(--border-faint)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Your Session</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-lg"
              style={{
                background: isOnline ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                color: isOnline ? '#60a5fa' : '#34d399',
                border: `1px solid ${isOnline ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}>
              {isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              {isOnline ? 'Video Call Session' : 'In-Person Session'}
            </span>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Clinician */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', color: '#fff' }}>
                {(expert.full_name || 'Dr').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{expert.full_name}</p>
                {expert.specializations?.[0] && (
                  <p className="text-xs" style={{ color: 'var(--primary-light)' }}>{expert.specializations[0]}</p>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-faint)' }} />

            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)' }}>
                <Calendar className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Date</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {fmtDate(startDt)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {fmtTime(startDt, session.slotLabel)} – {fmtTime(endDt, '')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Your Details ─────────────────────────────────────────── */}
        <div className="rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Details</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Name</p>
                <p className="text-sm" style={{ color: user?.full_name ? 'var(--text-primary)' : 'var(--warning)' }}>
                  {user?.full_name || 'Not set — please update your profile'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Phone</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{user?.phone || '—'}</p>
              </div>
            </div>
            {user?.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Price Breakdown ──────────────────────────────────────── */}
        {session.price > 0 && (
          <div className="rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Payment Summary</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isOnline ? 'Online session' : 'In-person session'} fee
                </span>
                <span className="flex items-center gap-0.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  <IndianRupee className="w-3.5 h-3.5" />₹{session.price}
                </span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-faint)' }} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="flex items-center gap-0.5 text-base font-bold" style={{ color: 'var(--primary-light)' }}>
                  <IndianRupee className="w-4 h-4" />₹{session.price}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Info Note ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid var(--border-accent)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            By proceeding, you agree to our cancellation policy.
            {isOnline
              ? ' A Google Meet link will be sent to you once the appointment is confirmed.'
              : ' Please arrive 5 minutes early at the clinic.'}
          </p>
        </div>
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background: 'rgba(7,14,26,0.95)', borderTop: '1px solid var(--border-faint)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={onBack}
            className="px-4 py-3 rounded-2xl text-sm font-medium"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            Proceed to Payment <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDetailsPage;
