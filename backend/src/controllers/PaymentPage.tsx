import React, { useState } from 'react';
import {
  ChevronLeft, CreditCard, Shield, Lock, Loader2,
  AlertCircle, IndianRupee, Smartphone, Building2,
  Video, MapPin, CheckCircle, Construction
} from 'lucide-react';
import { Expert } from '../../types';
import { SessionDetails } from './SessionDetailsPage';
import { appointmentService } from '../../services/appointment.service';
import { paymentService } from '../../services/payment.service';

interface Props {
  expert:    Expert;
  session:   SessionDetails;
  user:      any;
  onBack:    () => void;
  onSuccess: (appointmentId: string) => void;
}

type PayMethod = 'upi' | 'card' | 'netbanking';

function toISO(t: string, d: string): string {
  if (!t) return d + 'T00:00:00';
  if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return t;
  if (/^\d{2}:\d{2}/.test(t)) return `${d}T${t}`;
  return t;
}

function calcDuration(startISO: string, endISO: string): number {
  try {
    const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
    return ms > 0 ? Math.round(ms / 60000) : 30;
  } catch {
    return 30;
  }
}

const PaymentPage: React.FC<Props> = ({ expert, session, user, onBack, onSuccess }) => {
  const [method,  setMethod]  = useState<PayMethod>('upi');
  const [upiId,   setUpiId]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const startISO   = toISO(session.startTime, session.date);
  const endISO     = toISO(session.endTime,   session.date);
  const durationMs = new Date(endISO).getTime() - new Date(startISO).getTime();
  const durationMin = durationMs > 0 ? Math.round(durationMs / 60000) : 30;

  const handlePay = async () => {
    setLoading(true); setError('');
    try {
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

      // Extract the payment record ID created during appointment creation
      const paymentId =
        apptRes?.data?.paymentId ||
        apptRes?.paymentId ||
        apptRes?.data?.payment_id ||
        apptRes?.payment_id;

      if (!appointmentId) throw new Error('Could not create appointment');

      // Simulate payment processing (replace with real gateway in production)
      await new Promise(r => setTimeout(r, 1500));

      // Mark payment as completed — this is the step that was missing
      if (paymentId) {
        await paymentService.updateStatus(paymentId, 'completed');
      }

      // Confirm the appointment
      await appointmentService.updateStatus(appointmentId, 'confirmed');
      onSuccess(appointmentId);
    } catch (e: any) {
      console.error('[Payment] Error:', e.response?.data || e.message || e);
      setError(e.response?.data?.message || e.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOnline = session.mode === 'online';

  const methods: { id: PayMethod; icon: any; label: string; sub: string }[] = [
    { id:'upi',        icon: Smartphone, label:'UPI',         sub:'Pay via UPI ID or QR'  },
    { id:'card',       icon: CreditCard, label:'Card',        sub:'Credit / Debit card'    },
    { id:'netbanking', icon: Building2,  label:'Net Banking', sub:'All major banks'        },
  ];

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor:'var(--bg-deep)', color:'var(--text-primary)' }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur-sm px-4 py-3"
        style={{ background:'rgba(7,14,26,0.95)', borderBottom:'1px solid var(--border-faint)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} disabled={loading} className="p-2 rounded-xl transition-colors"
            style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Step 5 of 5</p>
            <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Payment</p>
          </div>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(s => (
              <div key={s} className="h-2 rounded-full transition-all"
                style={{ width:'8px', background:'var(--primary)' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Order Summary ─────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{
              background:'linear-gradient(90deg, var(--primary-glow), var(--secondary-glow))',
              borderBottom:'1px solid var(--border-faint)',
            }}>
            <div>
              <p className="text-xs" style={{ color:'var(--text-muted)' }}>Session with</p>
              <p className="text-sm font-bold" style={{ color:'var(--text-primary)' }}>{expert.full_name}</p>
              <span className="inline-flex items-center gap-1 text-[11px] mt-1.5 px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: isOnline ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                  color:      isOnline ? '#60a5fa' : '#34d399',
                  border:     `1px solid ${isOnline ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
                }}>
                {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {isOnline ? 'Online Session' : 'In-Person Session'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color:'var(--text-muted)' }}>Total</p>
              <p className="text-2xl font-bold flex items-center gap-0.5" style={{ color:'var(--primary-light)' }}>
                <IndianRupee className="w-5 h-5" />{session.price}
              </p>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color:'var(--success)' }} />
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>
              256-bit SSL encrypted · Mock payment for demo
            </p>
          </div>
        </div>

        {/* ── Payment method tabs ────────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color:'var(--text-secondary)' }}>Payment Method</p>
          <div className="grid grid-cols-3 gap-3">
            {methods.map(m => {
              const Icon   = m.icon;
              const active = method === m.id;
              return (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="p-4 rounded-2xl text-left transition-all relative"
                  style={{
                    background: active ? 'var(--primary-glow)' : 'var(--bg-surface)',
                    border:     `1px solid ${active ? 'var(--border-accent)' : 'var(--border-faint)'}`,
                  }}>
                  {active && (
                    <CheckCircle className="absolute top-2.5 right-2.5 w-3.5 h-3.5" style={{ color:'var(--primary)' }} />
                  )}
                  <Icon className="w-5 h-5 mb-2" style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {m.label}
                  </p>
                  <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color:'var(--text-muted)' }}>
                    {m.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Method form ────────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>

          {method === 'upi' && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color:'var(--text-secondary)' }}>UPI ID</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-medium)', color:'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-medium)'}
              />
              <p className="text-xs mt-2" style={{ color:'var(--text-muted)' }}>
                e.g. name@paytm · number@okaxis · name@ybl
              </p>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color:'var(--text-secondary)' }}>Card Number</label>
                <input placeholder="4242 4242 4242 4242" readOnly
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-medium)', color:'var(--text-muted)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color:'var(--text-secondary)' }}>Expiry</label>
                  <input placeholder="MM/YY" readOnly
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-medium)', color:'var(--text-muted)' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color:'var(--text-secondary)' }}>CVV</label>
                  <input placeholder="•••" readOnly type="password"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-medium)', color:'var(--text-muted)' }} />
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background:'var(--warning-glow)', color:'var(--warning)', border:'1px solid rgba(245,158,11,0.2)' }}>
                <Construction className="w-3.5 h-3.5 flex-shrink-0" /> Mock payment — no real charge will be made
              </p>
            </div>
          )}

          {method === 'netbanking' && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color:'var(--text-secondary)' }}>Select Your Bank</label>
              <div className="grid grid-cols-3 gap-2">
                {['SBI','HDFC','ICICI','Axis','Kotak','Other'].map(bank => (
                  <button key={bank}
                    className="py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all"
                    style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-faint)', color:'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-faint)'}>
                    {bank}
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-xs mt-3 px-3 py-2 rounded-lg" style={{ background:'var(--warning-glow)', color:'var(--warning)', border:'1px solid rgba(245,158,11,0.2)' }}>
                <Construction className="w-3.5 h-3.5 flex-shrink-0" /> Mock payment — booking will be confirmed immediately
              </p>
            </div>
          )}
        </div>

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background:'var(--danger-glow)', border:'1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color:'var(--danger)' }} />
            <p className="text-sm" style={{ color:'#fca5a5' }}>{error}</p>
          </div>
        )}
      </div>

      {/* ── Fixed pay button ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background:'rgba(7,14,26,0.97)', borderTop:'1px solid var(--border-faint)', backdropFilter:'blur(16px)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={handlePay} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-60"
            style={{ background:'linear-gradient(135deg, var(--primary-dark), var(--primary))', color:'#fff', boxShadow:'0 4px 20px var(--primary-glow)' }}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment…</>
              : <><Lock className="w-4 h-4" /> Pay ₹{session.price} Securely</>
            }
          </button>
          <p className="text-center text-xs mt-2" style={{ color:'var(--text-muted)' }}>
            Mock payment · No real charge · For demonstration only
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
