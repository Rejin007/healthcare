import React, { useState, useEffect } from 'react';
import {
  User, Bell, Lock, Database, Mail, Save, Phone, Shield,
  CheckCircle, AlertCircle, Eye, EyeOff, Server, Activity,
  RefreshCw, Key, Globe, Clock
} from 'lucide-react';
import api from '../services/api';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role_name: string;
  created_at: string;
}

interface SystemInfo {
  database: { connected: boolean; version: string; server_time: string };
  counts: { total_patients: string; total_experts: string; total_appointments: string; total_payments: string; total_admins: string };
  server: { node_version: string; environment: string; uptime_seconds: number };
}

type Tab = 'profile' | 'notifications' | 'security' | 'system';

const inputCls = 'w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Notifications (local prefs)
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, push: true, appointments: true, payments: true, system: false });
  const [notifSaved, setNotifSaved] = useState(false);

  // System
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [sysLoading, setSysLoading] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (activeTab === 'system' && !sysInfo) loadSystemInfo();
  }, [activeTab, sysInfo]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get('/settings/profile');
      const data = res.data.data;
      setProfile(data);
      setProfileForm({ full_name: data.full_name || '', phone: data.phone || '' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      setSysLoading(true);
      const res = await api.get('/settings/system');
      setSysInfo(res.data.data);
    } catch {
      // silent
    } finally {
      setSysLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profileForm.full_name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }
    try {
      setProfileSaving(true);
      setProfileMsg(null);
      await api.put('/settings/profile', profileForm);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      loadProfile();
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password) {
      setPwMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    try {
      setPwLoading(true);
      setPwMsg(null);
      await api.put('/settings/password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwMsg(null), 3000);
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const saveNotifs = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  };

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and system preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            {/* Avatar */}
            <div className="flex flex-col items-center py-5 mb-3 border-b border-slate-800">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
                {profile?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <p className="text-sm font-semibold text-white truncate max-w-full px-2">{profile?.full_name || '—'}</p>
              <span className="mt-1.5 text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20 capitalize">
                {profile?.role_name || 'Admin'}
              </span>
            </div>
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-6 min-h-[500px]">

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Profile Information</h2>
                  <p className="text-xs text-slate-500">Update your name and contact details</p>
                </div>
              </div>

              {profileLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-cyan-500" />
                </div>
              ) : (
                <>
                  {profileMsg && (
                    <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${profileMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                      {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={profileForm.full_name} onChange={e => setProfileForm(f => ({...f, full_name: e.target.value}))} placeholder="Your full name" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" value={profile?.email || ''} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                      <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({...f, phone: e.target.value}))} placeholder="+91 XXXXXXXX" className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Role</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" value={profile?.role_name || 'Administrator'} disabled className={`${inputCls} pl-10 opacity-50 cursor-not-allowed capitalize`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Member Since</label>
                      <input type="text" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={saveProfile} disabled={profileSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                      {profileSaving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                      {profileSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Notification Preferences</h2>
                  <p className="text-xs text-slate-500">Choose how you want to be notified</p>
                </div>
              </div>

              {notifSaved && (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> Preferences saved!
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Channels</p>
                <div className="space-y-3">
                  {[
                    { key: 'email', icon: Mail, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Email Notifications', desc: 'Receive alerts and summaries via email' },
                    { key: 'sms', icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'SMS Notifications', desc: 'Get critical updates via SMS' },
                    { key: 'push', icon: Bell, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Push Notifications', desc: 'Browser push notifications' },
                  ].map(({ key, icon: Icon, color, bg, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{label}</p>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                      </div>
                      <Toggle checked={notifPrefs[key as keyof typeof notifPrefs] as boolean} onChange={v => setNotifPrefs(p => ({...p, [key]: v}))} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Event Types</p>
                <div className="space-y-3">
                  {[
                    { key: 'appointments', label: 'New Appointments', desc: 'When a new appointment is booked or updated' },
                    { key: 'payments', label: 'Payment Updates', desc: 'When a payment is received or failed' },
                    { key: 'system', label: 'System Alerts', desc: 'Server health and error notifications' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <Toggle checked={notifPrefs[key as keyof typeof notifPrefs] as boolean} onChange={v => setNotifPrefs(p => ({...p, [key]: v}))} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={saveNotifs}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Security Settings</h2>
                  <p className="text-xs text-slate-500">Change your password and manage access</p>
                </div>
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {pwMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {pwMsg.text}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Change Password</p>
                <div className="space-y-4 max-w-md">
                  {[
                    { key: 'current_password', label: 'Current Password', show: showPw.current, toggleKey: 'current' },
                    { key: 'new_password', label: 'New Password', show: showPw.new, toggleKey: 'new' },
                    { key: 'confirm_password', label: 'Confirm New Password', show: showPw.confirm, toggleKey: 'confirm' },
                  ].map(({ key, label, show, toggleKey }) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={show ? 'text' : 'password'}
                          value={pwForm[key as keyof typeof pwForm]}
                          onChange={e => setPwForm(f => ({...f, [key]: e.target.value}))}
                          placeholder="••••••••"
                          className={`${inputCls} pl-10 pr-10`}
                        />
                        <button type="button"
                          onClick={() => setShowPw(s => ({...s, [toggleKey]: !s[toggleKey as keyof typeof s]}))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {key === 'new_password' && pwForm.new_password && (
                        <div className="mt-1.5 flex gap-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                              pwForm.new_password.length >= i * 3
                                ? i <= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                                : 'bg-slate-700'
                            }`} />
                          ))}
                          <span className="text-xs text-slate-500 ml-2">
                            {pwForm.new_password.length < 6 ? 'Weak' : pwForm.new_password.length < 10 ? 'Fair' : 'Strong'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl max-w-md">
                <p className="text-xs font-semibold text-slate-400 mb-2">Password Requirements</p>
                {[
                  { ok: pwForm.new_password.length >= 6, text: 'At least 6 characters' },
                  { ok: /[A-Z]/.test(pwForm.new_password), text: 'One uppercase letter' },
                  { ok: /[0-9]/.test(pwForm.new_password), text: 'One number' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs mt-1">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${r.ok && pwForm.new_password ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      {r.ok && pwForm.new_password && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={r.ok && pwForm.new_password ? 'text-emerald-400' : 'text-slate-500'}>{r.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={changePassword} disabled={pwLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {pwLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Lock className="w-4 h-4" />}
                  {pwLoading ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">System Information</h2>
                    <p className="text-xs text-slate-500">Live database and server stats</p>
                  </div>
                </div>
                <button onClick={loadSystemInfo} disabled={sysLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${sysLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {sysLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-cyan-500" />
                </div>
              ) : sysInfo ? (
                <>
                  {/* Database Status */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Database</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${sysInfo.database.connected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'} animate-pulse`} />
                          <span className="text-sm text-slate-300">Connection Status</span>
                        </div>
                        <span className={`text-sm font-medium ${sysInfo.database.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sysInfo.database.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                        <span className="text-sm text-slate-300 flex items-center gap-2"><Globe className="w-4 h-4 text-slate-500" /> Server Time</span>
                        <span className="text-sm text-slate-400">{new Date(sysInfo.database.server_time).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Counts */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Database Records</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Patients', value: sysInfo.counts.total_patients, color: 'text-cyan-400' },
                        { label: 'Experts', value: sysInfo.counts.total_experts, color: 'text-violet-400' },
                        { label: 'Appointments', value: sysInfo.counts.total_appointments, color: 'text-blue-400' },
                        { label: 'Payments', value: sysInfo.counts.total_payments, color: 'text-emerald-400' },
                        { label: 'Admins', value: sysInfo.counts.total_admins, color: 'text-amber-400' },
                      ].map(item => (
                        <div key={item.label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 text-center">
                          <p className={`text-2xl font-bold ${item.color}`}>{Number(item.value).toLocaleString()}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Server Info */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Server</p>
                    <div className="space-y-3">
                      {[
                        { icon: Server, label: 'Node.js Version', value: sysInfo.server.node_version },
                        { icon: Activity, label: 'Environment', value: sysInfo.server.environment || 'development' },
                        { icon: Clock, label: 'Server Uptime', value: formatUptime(sysInfo.server.uptime_seconds) },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                          <span className="text-sm text-slate-300 flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-500" /> {label}
                          </span>
                          <span className="text-sm font-mono text-slate-400 capitalize">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Database className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Could not load system information</p>
                  <button onClick={loadSystemInfo} className="mt-3 text-xs text-cyan-400 hover:underline">Try again</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
