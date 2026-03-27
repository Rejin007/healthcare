import React, { useState, useEffect } from 'react';
import {
  IndianRupee, Download, CheckCircle, XCircle, Clock, Search,
  Eye, RefreshCw, Calendar, AlertCircle, FileText,
  CreditCard, User, Phone, Link2, Send, Copy, X, Plus,
  ExternalLink, MessageSquare, Banknote, BarChart3, Zap
} from 'lucide-react';
import { paymentService } from '../services/payment.service';
import api from '../services/api';

interface Payment {
  id: string;
  patient_name: string;
  patient_phone: string;
  expert_name?: string;
  amount: number;
  status: string;
  created_at: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  appointment_time?: string;
  appointment_mode?: string;
  currency: string;
}

interface PaymentLink {
  id: string;
  link_url: string;
  status: string;
  created_at: string;
  expires_at: string;
  amount?: number;
  currency?: string;
  payment_status?: string;
  patient_name?: string;
  patient_phone?: string;
  expert_name?: string;
  appointment_time?: string;
  appointment_mode?: string;
  appointment_id?: string;
}

interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_revenue: number;
  pending_amount: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  failed:    'bg-red-500/15 text-red-400 border-red-500/30',
  refunded:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
  active:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  expired:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'completed') return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === 'failed')    return <XCircle className="w-3.5 h-3.5" />;
  if (status === 'refunded')  return <RefreshCw className="w-3.5 h-3.5" />;
  if (status === 'active')    return <Zap className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
    <StatusIcon status={status} />
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
      title="Copy"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// ── Generate Link Modal ───────────────────────────────────────────────────────

const GenerateLinkModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [appointmentId, setAppointmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const generate = async () => {
    if (!appointmentId.trim() || !amount) { setError('Appointment ID and amount are required'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/payments/links/generate', {
        appointment_id: appointmentId.trim(),
        amount: Number(amount),
        send_sms: sendSms,
      });
      setResult(res.data.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate link');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" /> Generate Payment Link
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-400 font-semibold">Link Generated!</p>
              </div>
              <p className="text-sm text-slate-300 mb-1">Patient: <span className="text-white font-medium">{result.patient_name}</span></p>
              <p className="text-sm text-slate-300 mb-3">Phone: <span className="text-white font-medium">{result.patient_phone}</span></p>
              {result.sms_sent && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> SMS sent to patient
                </p>
              )}
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-500 mb-1.5">Payment Link</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-cyan-400 flex-1 truncate font-mono">{result.link_url}</p>
                <CopyBtn text={result.link_url} />
                <a href={result.link_url} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Appointment ID</label>
              <input
                type="text" value={appointmentId}
                onChange={e => setAppointmentId(e.target.value)}
                placeholder="Paste appointment UUID…"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number" min="1" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>
            <div
              onClick={() => setSendSms(!sendSms)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sendSms ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800/40 border-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sendSms ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                {sendSms && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Send SMS to patient</p>
                <p className="text-xs text-slate-500">Sends payment link via SMS automatically</p>
              </div>
            </div>
            <button
              onClick={generate} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white rounded-xl font-medium transition-colors"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Link2 className="w-4 h-4" />}
              {loading ? 'Generating…' : 'Generate & Send Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Payments: React.FC = () => {
  const [tab, setTab] = useState<'transactions' | 'links'>('transactions');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => { loadPayments(); loadStats(); }, [filter, pagination.currentPage]);
  useEffect(() => { if (tab === 'links') loadPaymentLinks(); }, [tab]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAll(pagination.currentPage, 20, filter);
      setPayments(response.data.payments || []);
      setPagination(response.data.pagination || pagination);
    } catch { setPayments([]); } finally { setLoading(false); }
  };

  const loadStats = async () => {
    try { const r = await paymentService.getStats(); setStats(r.data); } catch {}
  };

  const loadPaymentLinks = async () => {
    try {
      setLinksLoading(true);
      const res = await api.get('/payments/links');
      setPaymentLinks(res.data.data || []);
    } catch {} finally { setLinksLoading(false); }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      await paymentService.updateStatus(paymentId, newStatus);
      loadPayments(); loadStats(); setShowModal(false);
    } catch { alert('Failed to update payment status'); }
  };

  const handleResendLink = async (linkId: string) => {
    setResendingId(linkId);
    try {
      await api.post(`/payments/links/${linkId}/resend`);
      alert('SMS resent to patient!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resend SMS');
    } finally { setResendingId(null); }
  };

  const exportToCSV = () => {
    const csv = [
      ['Patient Name', 'Phone', 'Expert', 'Amount', 'Status', 'Transaction ID', 'Date'],
      ...filteredPayments.map(p => [
        p.patient_name || 'N/A', p.patient_phone, p.expert_name || 'N/A',
        p.amount, p.status, p.razorpay_payment_id || 'N/A',
        new Date(p.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const filteredPayments = payments.filter(p =>
    p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_phone?.includes(searchTerm) ||
    p.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinks = paymentLinks.filter(l =>
    l.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.patient_phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Management</h1>
          <p className="text-slate-400 text-sm mt-1">Track transactions and manage payment links</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Generate Payment Link
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: IndianRupee, bg: 'bg-emerald-500/10', color: 'text-emerald-400', value: `₹${Number(stats.total_revenue).toLocaleString()}`, label: 'Total Revenue', sub: `${stats.completed_payments} completed` },
            { icon: CheckCircle, bg: 'bg-emerald-500/10', color: 'text-emerald-400', value: stats.completed_payments, label: 'Successful', sub: `${stats.total_payments > 0 ? Math.round((stats.completed_payments / stats.total_payments) * 100) : 0}% success rate` },
            { icon: Clock, bg: 'bg-amber-500/10', color: 'text-amber-400', value: stats.pending_payments, label: 'Pending', sub: `₹${Number(stats.pending_amount).toLocaleString()} outstanding` },
            { icon: XCircle, bg: 'bg-red-500/10', color: 'text-red-400', value: stats.failed_payments, label: 'Failed', sub: `${stats.total_payments > 0 ? Math.round((stats.failed_payments / stats.total_payments) * 100) : 0}% failure rate` },
          ].map(({ icon: Icon, bg, color, value, label, sub }) => (
            <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 ${bg} rounded-xl`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <BarChart3 className="w-4 h-4 text-slate-700" />
              </div>
              <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="text-xs text-slate-600 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'transactions', label: 'Transactions', icon: CreditCard },
            { id: 'links', label: 'Payment Links', icon: Link2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
          {/* Search right-aligned */}
          <div className="flex-1 flex items-center justify-end px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-44"
              />
            </div>
          </div>
        </div>

        {/* ── TRANSACTIONS ─────────────────────────────────── */}
        {tab === 'transactions' && (
          <>
            {/* Filter / action bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/60 flex-wrap">
              {['all', 'completed', 'pending', 'failed', 'refunded'].map(s => (
                <button key={s}
                  onClick={() => { setFilter(s); setPagination(p => ({ ...p, currentPage: 1 })); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filter === s
                      ? (STATUS_COLORS[s] || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30')
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button onClick={loadPayments} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Banknote className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{searchTerm ? 'No payments match your search' : 'No payments found'}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {['Patient', 'Doctor', 'Amount', 'Status', 'Transaction ID', 'Date', ''].map(h => (
                          <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map(payment => (
                        <tr key={payment.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{payment.patient_name || 'N/A'}</p>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <Phone className="w-3 h-3" />{payment.patient_phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-sm text-slate-300">{payment.expert_name ? `Dr. ${payment.expert_name}` : '—'}</p>
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-sm font-bold text-emerald-400">₹{Number(payment.amount).toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{payment.currency || 'INR'}</p>
                          </td>
                          <td className="py-4 px-5"><StatusBadge status={payment.status} /></td>
                          <td className="py-4 px-5">
                            <p className="text-xs font-mono text-slate-400">
                              {payment.razorpay_payment_id ? payment.razorpay_payment_id.substring(0, 18) + '…' : '—'}
                            </p>
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-sm text-slate-300">{new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs text-slate-500">{new Date(payment.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="py-4 px-5">
                            <button onClick={() => { setSelectedPayment(payment); setShowModal(true); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
                    <p className="text-sm text-slate-400">Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total</p>
                    <div className="flex gap-2">
                      <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} disabled={pagination.currentPage === 1}
                        className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg">Prev</button>
                      <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── PAYMENT LINKS ─────────────────────────────────── */}
        {tab === 'links' && (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
              <p className="text-xs text-slate-500">{paymentLinks.length} link{paymentLinks.length !== 1 ? 's' : ''} generated total</p>
              <button onClick={loadPaymentLinks}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {linksLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Link2 className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm mb-3">No payment links generated yet</p>
                <button onClick={() => setShowGenerateModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Generate your first link
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/40">
                {filteredLinks.map(link => (
                  <div key={link.id} className="p-5 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-medium text-white">{link.patient_name || 'Unknown Patient'}</p>
                            <StatusBadge status={link.status || 'active'} />
                            {link.amount && <span className="text-sm font-bold text-emerald-400">₹{Number(link.amount).toLocaleString()}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5 flex-wrap">
                            {link.patient_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{link.patient_phone}</span>}
                            {link.expert_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />Dr. {link.expert_name}</span>}
                            {link.appointment_time && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(link.appointment_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Created {new Date(link.created_at).toLocaleDateString('en-IN')}</span>
                            {link.expires_at && <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="w-3 h-3" />Expires {new Date(link.expires_at).toLocaleDateString('en-IN')}</span>}
                          </div>
                          {/* Link URL row */}
                          <div className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
                            <Link2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="text-xs text-cyan-400 truncate flex-1 font-mono">{link.link_url}</span>
                            <CopyBtn text={link.link_url} />
                            <a href={link.link_url} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResendLink(link.id)}
                        disabled={resendingId === link.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {resendingId === link.id
                          ? <div className="w-3.5 h-3.5 border border-slate-500 border-t-slate-200 rounded-full animate-spin" />
                          : <Send className="w-3.5 h-3.5" />}
                        Resend SMS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" /> Payment Details
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1.5">Amount</p>
                  <p className="text-2xl font-bold text-emerald-400">₹{Number(selectedPayment.amount).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedPayment.currency || 'INR'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1.5">Status</p>
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Patient</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="text-white font-medium">{selectedPayment.patient_name || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-white">{selectedPayment.patient_phone}</span></div>
                  {selectedPayment.expert_name && <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="text-white">Dr. {selectedPayment.expert_name}</span></div>}
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Transaction</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Payment ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-300 truncate max-w-[160px]">{selectedPayment.razorpay_payment_id || 'N/A'}</span>
                      {selectedPayment.razorpay_payment_id && <CopyBtn text={selectedPayment.razorpay_payment_id} />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Order ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-300 truncate max-w-[160px]">{selectedPayment.razorpay_order_id || 'N/A'}</span>
                      {selectedPayment.razorpay_order_id && <CopyBtn text={selectedPayment.razorpay_order_id} />}
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-slate-300">{new Date(selectedPayment.created_at).toLocaleString('en-IN')}</span></div>
                </div>
              </div>
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-2 border-t border-slate-800">
                  <button onClick={() => handleUpdateStatus(selectedPayment.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                    <CheckCircle className="w-4 h-4" /> Mark as Paid
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedPayment.id, 'failed')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-xl border border-red-500/30 transition-colors">
                    <XCircle className="w-4 h-4" /> Mark as Failed
                  </button>
                </div>
              )}
              {selectedPayment.status === 'completed' && (
                <button onClick={() => handleUpdateStatus(selectedPayment.id, 'refunded')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-600 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Issue Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Modal ─────────────────────────────────────────── */}
      {showGenerateModal && (
        <GenerateLinkModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => { loadPaymentLinks(); setTab('links'); }}
        />
      )}
    </div>
  );
};

export default Payments;
