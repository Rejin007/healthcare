import React, { useState, useEffect } from 'react';
import {
  Activity, Calendar, Clock, Video, MapPin, LogOut,
  User, Phone, Mail, CheckCircle, ChevronLeft, ChevronRight,
  Stethoscope, IndianRupee, XCircle, Loader2, Edit3, Save,
  X, AlertCircle, CalendarDays, RefreshCw
} from 'lucide-react';
import { appointmentService } from '../services/appointment.service';
import { useAuth } from '../App';
import api from '../services/api';

interface Appt {
  id: string;
  start_time: string;
  end_time: string;
  mode: 'online' | 'inperson';
  status: string;
  expert_name?: string;
  amount?: number;
  payment_status?: string;
  google_meet_link?: string;
}

const STATUS_STYLE: Record<string, string> = {
  scheduled:     'bg-blue-500/10 text-blue-400 border-blue-500/30',
  confirmed:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  completed:     'bg-violet-500/10 text-violet-400 border-violet-500/30',
  cancelled:     'bg-red-500/10 text-red-400 border-red-500/30',
  'no-show':     'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

type Tab = 'upcoming' | 'all' | 'completed';

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const [appts, setAppts]             = useState<Appt[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<Tab>('upcoming');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);

  // profile edit
  const [editing, setEditing]         = useState(false);
  const [pName, setPName]             = useState(user?.full_name || '');
  const [pEmail, setPEmail]           = useState(user?.email || '');
  const [saving, setSaving]           = useState(false);
  const [saveErr, setSaveErr]         = useState('');

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [tab, page]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const filters: Record<string, string> = { user_id: user.id };
      if (tab === 'upcoming')  { filters.status = 'scheduled'; filters.upcoming = 'true'; }
      if (tab === 'completed') { filters.status = 'completed'; }
      const res = await appointmentService.getAll(page, 5, filters);
      setAppts(res.data.appointments || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch { setAppts([]); }
    finally  { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true); setSaveErr('');
    try {
      await api.put(`/patients/${user.id}`, { full_name: pName, email: pEmail });
      const updated = { ...user, full_name: pName, email: pEmail };
      localStorage.setItem('user', JSON.stringify(updated));
      setEditing(false);
      window.location.reload();
    } catch (e: any) {
      setSaveErr(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isToday = (iso: string) => {
    const d = new Date(iso); const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  return (
    <div className="min-h-screen bg-[#070e1a] text-slate-100">
      {/* bg grid */}
      <div className="fixed inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 0 10 L 40 10 M 10 0 L 10 40 M 0 20 L 40 20 M 20 0 L 20 40 M 0 30 L 40 30 M 30 0 L 30 40' fill='none' stroke='%230f2844' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")" }}
      />

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 sm:px-6 py-4 sticky top-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Nila Healthcare</p>
              <p className="text-[10px] text-slate-500">Patient Portal</p>
            </div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 rounded-xl text-slate-400 hover:text-red-400 text-sm transition-all">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-7 space-y-5">

        {/* ── Profile Card ─────────────────────────────────────────── */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          {!editing ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {(user?.full_name || user?.phone || 'P')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {user?.full_name || 'Hello, Patient'}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />{user?.phone}
                    </span>
                    {user?.email && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail className="w-3 h-3" />{user.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => { setEditing(true); setPName(user?.full_name || ''); setPEmail(user?.email || ''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition-all flex-shrink-0">
                <Edit3 className="w-3.5 h-3.5" />Edit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Edit Profile</p>
              {saveErr && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{saveErr}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Your name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} placeholder="your@email.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-lg transition-colors flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',     value: totalItems, icon: CalendarDays, accent: 'cyan',    tab: 'all'       },
            { label: 'Upcoming',  value: tab === 'upcoming'  ? totalItems : '—', icon: Clock,        accent: 'amber',   tab: 'upcoming'  },
            { label: 'Completed', value: tab === 'completed' ? totalItems : '—', icon: CheckCircle,  accent: 'emerald', tab: 'completed' },
          ].map(s => (
            <button key={s.label} onClick={() => setTab(s.tab as Tab)}
              className={`bg-${s.accent}-500/10 border border-${s.accent}-500/20 rounded-xl p-3 sm:p-4 text-center transition-all ${tab === s.tab ? `ring-1 ring-${s.accent}-500/40` : 'hover:bg-slate-800/30'}`}>
              <s.icon className={`w-4 h-4 text-${s.accent}-400 mx-auto mb-1`} />
              <p className={`text-xl font-bold text-${s.accent}-400`}>{s.value}</p>
              <p className="text-[11px] text-slate-500">{s.label}</p>
            </button>
          ))}
        </div>

        {/* ── Appointments ─────────────────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">

          {/* Tabs + refresh */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 gap-3">
            <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 flex-1 max-w-xs">
              {(['upcoming','all','completed'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    tab === t
                      ? 'bg-cyan-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={load} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : appts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Calendar className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No {tab} appointments</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {appts.map(appt => (
                <div key={appt.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">

                    {/* Left */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Stethoscope className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {appt.expert_name || 'Doctor'}
                          {isToday(appt.start_time) && (
                            <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">Today</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays className="w-3 h-3" />{fmt(appt.start_time)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />{fmtTime(appt.start_time)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {/* Mode badge */}
                          <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                            appt.mode === 'online'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-green-500/10 text-green-400 border-green-500/30'
                          }`}>
                            {appt.mode === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {appt.mode === 'online' ? 'Online' : 'In-Person'}
                          </span>
                          {/* Status badge */}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[appt.status] || STATUS_STYLE.scheduled}`}>
                            {appt.status}
                          </span>
                          {/* Amount */}
                          {appt.amount && (
                            <span className="flex items-center gap-0.5 text-[11px] text-emerald-400 font-medium">
                              <IndianRupee className="w-3 h-3" />₹{appt.amount}
                            </span>
                          )}
                        </div>
                        {/* Meet link */}
                        {appt.mode === 'online' && appt.google_meet_link && ['confirmed','in-progress'].includes(appt.status) && (
                          <a href={appt.google_meet_link} target="_blank" rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs rounded-lg transition-colors">
                            <Video className="w-3.5 h-3.5" />Join Video Call
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Payment status */}
                    <div className="flex-shrink-0 text-right">
                      {appt.payment_status && (
                        <span className={`text-[10px] font-medium capitalize ${
                          appt.payment_status === 'completed' ? 'text-emerald-400' :
                          appt.payment_status === 'pending'   ? 'text-amber-400'  : 'text-slate-400'
                        }`}>
                          {appt.payment_status === 'completed'
                            ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>
                            : appt.payment_status === 'pending'
                            ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                            : appt.payment_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          To book or modify appointments, please contact the clinic directly.
        </p>
      </div>
    </div>
  );
};

export default PatientDashboard;
