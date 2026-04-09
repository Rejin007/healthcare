import React, { useState } from 'react';
import {
  ChevronLeft, CreditCard, Shield, Lock, Check,
  Loader2, AlertCircle, IndianRupee, Smartphone, Building2,
  Video, MapPin
} from 'lucide-react';
import { Expert } from '../../types';
import { SessionDetails } from './SessionDetailsPage';
import { appointmentService } from '../../services/appointment.service';

interface PaymentPageProps {
  expert: Expert;
  session: SessionDetails;
  user: any;
  onBack: () => void;
  onSuccess: (appointmentId: string) => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking';

// Convert session time strings to full ISO datetimes
function toISO(timeStr: string, dateStr: string): string {
  if (!timeStr) return dateStr + 'T00:00:00';
  if (/^\d{4}-\d{2}-\d{2}T/.test(timeStr)) return timeStr;
  if (/^\d{2}:\d{2}/.test(timeStr)) return `${dateStr}T${timeStr}`;
  return timeStr;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ expert, session, user, onBack, onSuccess }) => {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startISO = toISO(session.startTime, session.date);
  const endISO   = toISO(session.endTime,   session.date);

  const durationMs = new Date(endISO).getTime() - new Date(startISO).getTime();
  const durationMin = durationMs > 0 ? Math.round(durationMs / 60000) : 30;

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create the appointment
      const apptRes = await appointmentService.create({
        expert_id:  expert.id,
        user_id:    user.id,
        mode:       session.mode,
        start_time: startISO,
        end_time:   endISO,
        duration:   durationMin,
      });

      const appointmentId =
        apptRes?.data?.appointment?.id ||
        apptRes?.appointment?.id ||
        apptRes?.data?.id ||
        apptRes?.id;

      if (!appointmentId) throw new Error('Could not create appointment');

      // 2. Simulate payment processing
      await new Promise(r => setTimeout(r, 1500));

      // 3. Mark as confirmed
      await appointmentService.updateStatus(appointmentId, 'confirmed');

      onSuccess(appointmentId);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOnline = session.mode === 'online';

  const methods = [
    { id: 'upi'        as PaymentMethod, icon: Smartphone, label: 'UPI',        sub: 'Pay via UPI ID or QR' },
    { id: 'card'       as PaymentMethod, icon: CreditCard, label: 'Card',       sub: 'Credit / Debit Card' },
    { id: 'netbanking' as PaymentMethod, icon: Building2,  label: 'Net Banking', sub: 'All major banks' },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur-sm px-4 py-3"
        style={{ background: 'rgba(7,14,26,0.9)', borderBottom: '1px solid var(--border-faint)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} disabled={loading} className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Step 4 of 4</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Payment</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Order summary ────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.08), rgba(124,58,237,0.06))', borderBottom: '1px solid var(--border-faint)' }}>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Session with</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{expert.full_name}</p>
              <span className="inline-flex items-center gap-1 text-[11px] mt-1 px-2 py-0.5 rounded-full"
                style={{
                  background: isOnline ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                  color: isOnline ? '#60a5fa' : '#34d399',
                  border: `1px solid ${isOnline ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
                }}>
                {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {isOnline ? 'Online' : 'In-Person'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Amount due</p>
              <p className="flex items-center gap-0.5 text-xl font-bold justify-end" style={{ color: 'var(--primary-light)' }}>
                <IndianRupee className="w-5 h-5" />₹{session.price}
              </p>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Secured by 256-bit SSL encryption &nbsp;·&nbsp; Mock payment for demo
            </p>
          </div>
        </div>

        {/* ── Payment method tabs ───────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {methods.map(m => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: active ? 'var(--primary-glow)' : 'var(--bg-surface)',
                    border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border-faint)'}`,
                  }}>
                  <Icon className="w-4 h-4 mb-2" style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <p className="text-xs font-medium" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {m.label}
                  </p>
                  <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    {m.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Method-specific form ─────────────────────────────────── */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>

          {method === 'upi' && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>UPI ID</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Enter your UPI ID (e.g., name@paytm, number@okaxis)
              </p>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Card Number</label>
                <input placeholder="4242 4242 4242 4242" readOnly
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Expiry</label>
                  <input placeholder="MM/YY" readOnly
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>CVV</label>
                  <input placeholder="•••" readOnly type="password"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--warning)' }}>
                🚧 This is a mock payment — no real charge will be made
              </p>
            </div>
          )}

          {method === 'netbanking' && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Select Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Other'].map(bank => (
                  <button key={bank} className="py-2 px-3 rounded-xl text-xs text-left transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-faint)'}>
                    {bank}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--warning)' }}>
                🚧 Mock payment — booking will be confirmed immediately
              </p>
            </div>
          )}
        </div>

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--danger)' }} />
            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background: 'rgba(7,14,26,0.95)', borderTop: '1px solid var(--border-faint)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={handlePay} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><Lock className="w-4 h-4" /> Pay ₹{session.price} Securely</>
            )}
          </button>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Mock payment · No real charge · For demonstration only
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
