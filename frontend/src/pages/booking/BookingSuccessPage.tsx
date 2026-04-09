import React, { useEffect, useState } from 'react';
import {
  CheckCircle, Calendar, Clock, Video, MapPin,
  ChevronRight, Download, Share2, Home, IndianRupee, Stethoscope
} from 'lucide-react';
import { Expert } from '../../types';
import { SessionDetails } from './SessionDetailsPage';

interface BookingSuccessProps {
  expert: Expert;
  session: SessionDetails;
  appointmentId: string;
  onViewDashboard: () => void;
  onBookAnother: () => void;
}

const BookingSuccessPage: React.FC<BookingSuccessProps> = ({
  expert, session, appointmentId, onViewDashboard, onBookAnother
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isOnline = session.mode === 'online';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--success) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md">

        {/* ── Success Icon ─────────────────────────────────────────── */}
        <div className="flex justify-center mb-6">
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--success-glow)',
                border: '2px solid var(--success)',
                boxShadow: '0 0 30px rgba(16,185,129,0.25)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1)' : 'scale(0.5)',
                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}>
              <CheckCircle className="w-10 h-10" style={{ color: 'var(--success)' }} />
            </div>
          </div>
        </div>

        {/* ── Heading ──────────────────────────────────────────────── */}
        <div className="text-center mb-8"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease 0.2s' }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Booking Confirmed! 🎉
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your appointment has been successfully booked.
            {isOnline ? ' You\'ll receive a Google Meet link shortly.' : ' See you at the clinic!'}
          </p>
        </div>

        {/* ── Appointment Card ─────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-faint)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.5s ease 0.35s',
          }}>
          {/* Booking ID header */}
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-faint)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Booking ID</span>
            <span className="text-xs font-mono font-medium" style={{ color: 'var(--primary-light)' }}>
              #{appointmentId.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Clinician */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', color: '#fff' }}>
                {(expert.full_name || 'Dr').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{expert.full_name}</p>
                {expert.specializations?.[0] && (
                  <p className="text-xs" style={{ color: 'var(--primary-light)' }}>{expert.specializations[0]}</p>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-faint)' }} />

            {/* Details */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fmt(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {fmtTime(session.startTime)} – {fmtTime(session.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isOnline ? <Video className="w-4 h-4" style={{ color: '#60a5fa' }} /> : <MapPin className="w-4 h-4" style={{ color: '#34d399' }} />}
                <span className="text-sm" style={{ color: isOnline ? '#60a5fa' : '#34d399' }}>
                  {isOnline ? 'Online – Video Call' : 'In-Person – Clinic Visit'}
                </span>
              </div>
              {session.price > 0 && (
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span className="text-sm" style={{ color: 'var(--success)' }}>₹{session.price} — Payment successful</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="px-5 py-3 flex items-center justify-center gap-2"
            style={{ background: 'var(--success-glow)', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>Appointment Confirmed</span>
          </div>
        </div>

        {/* ── Action Buttons ───────────────────────────────────────── */}
        <div className="space-y-3"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease 0.5s' }}>
          <button onClick={onViewDashboard}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            <Home className="w-4 h-4" /> View My Appointments
          </button>
          <button onClick={onBookAnother}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}>
            <Stethoscope className="w-4 h-4" /> Book Another Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
