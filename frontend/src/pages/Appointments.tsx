import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, X, AlertCircle, Filter,
  User, Stethoscope, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { appointmentService } from '../services/appointment.service';
import { expertService } from '../services/expert.service';
import { patientService } from '../services/patient.service';
import { Appointment, Expert, Patient, Pagination } from '../types';

type StatusFilter = 'all' | 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    expert_id: '',
    mode: 'online',
    start_time: '',
    duration: 30
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    loadAppointments();
  }, [pagination.currentPage, statusFilter]);

  useEffect(() => {
    // Pre-load experts and patients for the form
    loadFormData();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (statusFilter !== 'all') filters.status = statusFilter;

      const response = await appointmentService.getAll(pagination.currentPage, 10, filters);
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [expertsRes, patientsRes] = await Promise.all([
        expertService.getAll(1, 100),
        patientService.getAll(1, 200)
      ]);
      setExperts(expertsRes.data.experts || []);
      setPatients(patientsRes.data.patients || []);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await appointmentService.create(formData);
      setShowModal(false);
      setFormData({ user_id: '', expert_id: '', mode: 'online', start_time: '', duration: 30 });
      loadAppointments();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to create appointment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setStatusUpdating(id);
    try {
      await appointmentService.updateStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusClasses = (status: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      completed: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
      'no-show': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    };
    return map[status] || map.scheduled;
  };

  const statuses: StatusFilter[] = ['all', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

  return (
    <div className="p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.totalItems} total appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAppointments}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowModal(true); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPagination(p => ({ ...p, currentPage: 1 })); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-cyan-500 text-white border-cyan-500'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No appointments {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Expert</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Mode</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{appt.patient_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{appt.patient_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{appt.expert_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-slate-300">
                          {new Date(appt.start_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(appt.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-xs px-2 py-1 rounded border ${
                          appt.mode === 'online'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-green-500/10 text-green-400 border-green-500/30'
                        }`}>
                          {appt.mode}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-sm">
                        {appt.amount ? (
                          <span className="text-emerald-400 font-medium">₹{appt.amount}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusClasses(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {statusUpdating === appt.id ? (
                          <div className="w-5 h-5 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
                        ) : (
                          <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-300
                                       focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no-show">No Show</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Create Appointment</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Patient *</label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.phone}
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">No patients found. Add patients first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expert / Doctor *</label>
                <select
                  required
                  value={formData.expert_id}
                  onChange={(e) => setFormData({ ...formData, expert_id: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                >
                  <option value="">Select an expert</option>
                  {experts.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.full_name} {ex.experience_years ? `(${ex.experience_years} yrs)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mode *</label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200
                               focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  >
                    <option value="online">Online</option>
                    <option value="inperson">In-Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (min)</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200
                               focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
                             [color-scheme:dark]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  ) : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
