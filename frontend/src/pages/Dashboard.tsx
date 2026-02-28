import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Stethoscope, TrendingUp, RefreshCw,
  ArrowUpRight, Clock, CheckCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardService } from '../services/dashboard.service';
import { DashboardStats, Expert, Appointment } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topExperts, setTopExperts] = useState<Expert[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, expertsRes, appointmentsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTopExperts(5),
        dashboardService.getRecentAppointments(8)
      ]);
      setStats(statsRes.data);
      setTopExperts(expertsRes.data);
      setRecentAppointments(appointmentsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const leadSourceData = [
    { name: 'Website', value: 35, color: '#0ea5e9' },
    { name: 'Referral', value: 30, color: '#10b981' },
    { name: 'Social', value: 20, color: '#f59e0b' },
    { name: 'Direct', value: 15, color: '#8b5cf6' }
  ];

  const statCards = stats ? [
    {
      title: 'Total Patients',
      value: stats.total_patients.toLocaleString(),
      icon: Users,
      color: 'from-cyan-500 to-cyan-700',
      glow: 'shadow-cyan-500/20',
      change: '+10%'
    },
    {
      title: 'Active Experts',
      value: stats.active_experts.toLocaleString(),
      icon: Stethoscope,
      color: 'from-emerald-500 to-emerald-700',
      glow: 'shadow-emerald-500/20',
      change: '+5%'
    },
    {
      title: 'Total Appointments',
      value: stats.total_appointments.toLocaleString(),
      icon: Calendar,
      color: 'from-violet-500 to-violet-700',
      glow: 'shadow-violet-500/20',
      change: '+8%'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.total_revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-700',
      glow: 'shadow-amber-500/20',
      change: '+12%'
    }
  ] : [];

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'in-progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      completed: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
      'no-show': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    };
    return classes[status] || classes.scheduled;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-cyan-500" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg ${card.glow} flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {card.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-sm text-slate-400">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Patient Source</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {leadSourceData.map((source, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} />
                <span className="text-xs text-slate-400 truncate">{source.name}</span>
                <span className="text-xs font-medium text-slate-300 ml-auto">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Experts */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Top Experts</h3>
            <span className="text-xs text-slate-500">{topExperts.length} experts</span>
          </div>
          {topExperts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Stethoscope className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No experts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topExperts.map((expert, i) => (
                <div key={expert.id} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{expert.full_name || 'Unnamed Expert'}</p>
                    <p className="text-xs text-slate-400 truncate">{expert.bio || 'Healthcare Professional'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-cyan-400">{expert.total_patients || 0}</p>
                    <p className="text-xs text-slate-500">patients</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Recent Appointments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Patient</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Expert</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Mode</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center py-12 text-slate-500">
                      <Clock className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">No recent appointments</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <p className="text-sm font-medium text-white">{appt.patient_name || appt.user_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{appt.patient_phone || appt.user_phone}</p>
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-300">{appt.expert_name || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <p className="text-sm text-slate-300">{new Date(appt.start_time).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">{new Date(appt.start_time).toLocaleTimeString()}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-1 rounded border ${appt.mode === 'online' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                        {appt.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
