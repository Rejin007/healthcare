import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, Calendar, TrendingUp, Users, DollarSign,
  Filter, RefreshCw, CheckCircle, Clock, Stethoscope,
  ArrowUpRight, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../services/api';

interface ReportSummary {
  dateRange: { start: string; end: string };
  patients: { total: number; new_in_range: number };
  appointments: { total: number; in_range: number; completed: number; cancelled: number };
  revenue: { total_revenue: number; range_revenue: number; pending_revenue: number; completed_payments: number; avg_transaction: number };
  experts: { total: number };
  appointments_by_status: { status: string; count: string }[];
  top_experts: { full_name: string; appointments_count: string; revenue_generated: string; experience_years: number }[];
}

interface MonthlyRow {
  month: string;
  appointments: number;
  completed_appointments: number;
  new_patients: number;
  revenue: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981', scheduled: '#06b6d4', confirmed: '#3b82f6',
  cancelled: '#ef4444', 'in-progress': '#f59e0b', 'no-show': '#6b7280',
};
const PIE_COLORS = ['#10b981','#06b6d4','#3b82f6','#ef4444','#f59e0b','#6b7280'];

const inputCls = 'bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 [color-scheme:dark]';

const Reports: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: thirtyAgo, end: today });
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'revenue'|'appointments'|'patients'>('revenue');

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [sumRes, monthRes] = await Promise.all([
        api.get(`/reports/summary?start=${dateRange.start}&end=${dateRange.end}`),
        api.get('/reports/monthly'),
      ]);
      setSummary(sumRes.data.data);
      setMonthly(monthRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => { load(); }, []);

  const handleExport = async (type: 'appointments'|'payments'|'patients') => {
    setExportLoading(type);
    try {
      const res = await api.get(`/reports/export?type=${type}&start=${dateRange.start}&end=${dateRange.end}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${type}-${dateRange.start}-to-${dateRange.end}.csv`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed.'); }
    finally { setExportLoading(null); }
  };

  const completionRate = summary && summary.appointments.in_range > 0
    ? Math.round((summary.appointments.completed / summary.appointments.in_range) * 100) : 0;

  const quickRanges = [
    { label: 'Today', fn: () => setDateRange({ start: today, end: today }) },
    { label: '7 Days', fn: () => setDateRange({ start: new Date(Date.now()-7*864e5).toISOString().split('T')[0], end: today }) },
    { label: '30 Days', fn: () => setDateRange({ start: thirtyAgo, end: today }) },
    { label: '90 Days', fn: () => setDateRange({ start: new Date(Date.now()-90*864e5).toISOString().split('T')[0], end: today }) },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Live data from your database</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin':''}`} /> Refresh
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Date Range</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-500 mb-1.5">From</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({...d, start: e.target.value}))} className={`w-full ${inputCls}`} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-500 mb-1.5">To</label>
            <input type="date" value={dateRange.end} max={today} onChange={e => setDateRange(d => ({...d, end: e.target.value}))} className={`w-full ${inputCls}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickRanges.map(r => (
              <button key={r.label} onClick={r.fn}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors">
                {r.label}
              </button>
            ))}
            <button onClick={load}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
              <Filter className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
        </div>
      ) : summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              { label: 'New Patients', value: summary.patients.new_in_range.toLocaleString(), sub: `${summary.patients.total.toLocaleString()} total`, icon: Users, color: 'from-cyan-500 to-cyan-700', glow: 'shadow-cyan-500/20' },
              { label: 'Appointments', value: summary.appointments.in_range.toLocaleString(), sub: `${completionRate}% completion rate`, icon: Calendar, color: 'from-violet-500 to-violet-700', glow: 'shadow-violet-500/20' },
              { label: 'Revenue (Period)', value: `₹${Math.round(summary.revenue.range_revenue).toLocaleString()}`, sub: `avg ₹${Math.round(summary.revenue.avg_transaction).toLocaleString()}/txn`, icon: DollarSign, color: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/20' },
              { label: 'Active Experts', value: summary.experts.total.toLocaleString(), sub: `${summary.revenue.completed_payments} payments done`, icon: Stethoscope, color: 'from-amber-500 to-amber-700', glow: 'shadow-amber-500/20' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg ${card.glow}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Live
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                  <p className="text-sm font-medium text-slate-300">{card.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* 12-Month Trend Chart */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="text-base font-semibold text-white">12-Month Trend</h3>
              <div className="flex gap-2">
                {(['revenue','appointments','patients'] as const).map(c => (
                  <button key={c} onClick={() => setActiveChart(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${activeChart===c ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {activeChart === 'revenue' ? (
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="month" stroke="#475569" tick={{fontSize:11}}/>
                  <YAxis stroke="#475569" tick={{fontSize:11}} tickFormatter={v=>`₹${(Number(v)/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8}} formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,'Revenue']}/>
                  <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="url(#rg)" strokeWidth={2}/>
                </AreaChart>
              ) : activeChart === 'appointments' ? (
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="month" stroke="#475569" tick={{fontSize:11}}/>
                  <YAxis stroke="#475569" tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
                  <Legend/>
                  <Bar dataKey="appointments" fill="#3b82f6" name="Total" radius={[4,4,0,0]}/>
                  <Bar dataKey="completed_appointments" fill="#10b981" name="Completed" radius={[4,4,0,0]}/>
                </BarChart>
              ) : (
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="month" stroke="#475569" tick={{fontSize:11}}/>
                  <YAxis stroke="#475569" tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
                  <Area type="monotone" dataKey="new_patients" stroke="#8b5cf6" fill="url(#pg)" strokeWidth={2} name="New Patients"/>
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Status Breakdown + Top Experts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-5">Appointment Status (Period)</h3>
              {summary.appointments_by_status.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                  <Calendar className="w-10 h-10 mb-2 opacity-30"/>
                  <p className="text-sm">No appointments in this period</p>
                </div>
              ) : (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={summary.appointments_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                          {summary.appointments_by_status.map((e, i) => (
                            <Cell key={i} fill={STATUS_COLORS[e.status] || PIE_COLORS[i % PIE_COLORS.length]}/>
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {summary.appointments_by_status.map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor: STATUS_COLORS[e.status] || PIE_COLORS[i % PIE_COLORS.length]}}/>
                        <span className="text-xs text-slate-400 capitalize truncate">{e.status}</span>
                        <span className="text-xs font-semibold text-slate-300 ml-auto">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-5">Top Experts (Period)</h3>
              {summary.top_experts.filter(e => Number(e.appointments_count) > 0).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                  <Stethoscope className="w-10 h-10 mb-2 opacity-30"/>
                  <p className="text-sm">No expert data for this period</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.top_experts.map((expert, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${i===0?'bg-amber-500':i===1?'bg-slate-400':i===2?'bg-amber-700':'bg-slate-700'}`}>
                        {i+1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{expert.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{expert.experience_years||0} yrs exp</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-cyan-400">{expert.appointments_count} appts</p>
                        <p className="text-xs text-emerald-400">₹{Math.round(Number(expert.revenue_generated)).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label:'Revenue (Period)', value:`₹${Math.round(summary.revenue.range_revenue).toLocaleString()}`, sub:'In selected date range', icon:CheckCircle, color:'text-emerald-400', bg:'bg-emerald-500/10' },
              { label:'Pending Revenue', value:`₹${Math.round(summary.revenue.pending_revenue).toLocaleString()}`, sub:'Awaiting payment', icon:Clock, color:'text-amber-400', bg:'bg-amber-500/10' },
              { label:'All-Time Revenue', value:`₹${Math.round(summary.revenue.total_revenue).toLocaleString()}`, sub:`${summary.revenue.completed_payments} completed payments`, icon:TrendingUp, color:'text-cyan-400', bg:'bg-cyan-500/10' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${card.color}`}/>
                    </div>
                    <p className="text-sm text-slate-400">{card.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Export */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Download className="w-5 h-5 text-cyan-400"/>
              <h3 className="text-base font-semibold text-white">Export CSV Reports</h3>
              <span className="text-xs text-slate-500 ml-1">— for selected date range</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type:'appointments' as const, icon:Calendar, color:'text-blue-400', bg:'bg-blue-500/10', label:'Appointments', desc:'Full appointment list with details' },
                { type:'payments' as const, icon:DollarSign, color:'text-emerald-400', bg:'bg-emerald-500/10', label:'Payments', desc:'Transaction history & status' },
                { type:'patients' as const, icon:Users, color:'text-violet-400', bg:'bg-violet-500/10', label:'Patients', desc:'New patient registrations' },
              ].map(({ type, icon: Icon, color, bg, label, desc }) => (
                <button key={type} onClick={() => handleExport(type)} disabled={exportLoading===type}
                  className="flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all text-left disabled:opacity-60">
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {exportLoading===type
                      ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                      : <Icon className={`w-6 h-6 ${color}`}/>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
