import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, Phone, Mail, User, X, AlertCircle,
  ChevronLeft, ChevronRight, Send, CheckCircle, Clock
} from 'lucide-react';
import { patientService } from '../services/patient.service';
import { Patient, Pagination } from '../types';

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType }

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
          pointer-events-auto animate-fadeIn
          ${t.type === 'success'
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950 border-red-500/40 text-red-300'
          }`}
      >
        {t.type === 'success'
          ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          : <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
        }
        {t.message}
        <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

// ─── OTP Confirm Modal ────────────────────────────────────────────────────────
interface OTPModalProps {
  patient: Patient;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const OTPConfirmModal: React.FC<OTPModalProps> = ({ patient, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-cyan-500/15 rounded-xl flex items-center justify-center">
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Send OTP via Email</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        An OTP will be sent to the registered email address of:
      </p>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-6 space-y-2">
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <User className="w-4 h-4 text-slate-400" />
          {patient.full_name || '—'}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Mail className="w-4 h-4 text-cyan-400" />
          <span className="break-all">{patient.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone className="w-3.5 h-3.5" />
          {patient.phone}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300
                     rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60
                     text-white rounded-lg text-sm font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send OTP
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({ phone: '', email: '', full_name: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [otpTarget, setOtpTarget] = useState<Patient | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSentFor, setOtpSentFor] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(p => ({ ...p, currentPage: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadPatients();
  }, [pagination.currentPage, debouncedSearch]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll(pagination.currentPage, 10, debouncedSearch);
      setPatients(response.data.patients);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedPatient(null);
    setFormData({ phone: '', email: '', full_name: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({ phone: patient.phone, email: patient.email || '', full_name: patient.full_name || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (selectedPatient) {
        await patientService.update(selectedPatient.id, {
          email: formData.email || undefined,
          full_name: formData.full_name || undefined
        });
      } else {
        await patientService.create(formData);
      }
      setShowModal(false);
      loadPatients();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate patient "${name || 'this patient'}"?`)) return;
    setDeleteLoading(id);
    try {
      await patientService.delete(id);
      loadPatients();
    } catch (error) {
      alert('Failed to deactivate patient');
    } finally {
      setDeleteLoading(null);
    }
  };

  const openOtpModal = (patient: Patient) => {
    if (!patient.email) {
      addToast('This patient has no registered email address.', 'error');
      return;
    }
    setOtpTarget(patient);
  };

  const handleSendOTP = async () => {
    if (!otpTarget) return;
    setOtpLoading(true);
    try {
      await patientService.sendOTPEmail(otpTarget.id);
      setOtpSentFor(otpTarget.id);
      addToast(`OTP sent successfully to ${otpTarget.email}`, 'success');
      setOtpTarget(null);
      setTimeout(() => setOtpSentFor(null), 10000);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setPagination(p => ({ ...p, currentPage: page }));
  };

  return (
    <div className="p-6 animate-fadeIn">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Patients</h1>
        <p className="text-slate-400 text-sm mt-1">{pagination.totalItems.toLocaleString()} total patients</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm
                         text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <User className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{debouncedSearch ? 'No patients match your search' : 'No patients yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Registered</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {(patient.full_name || patient.phone).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{patient.full_name || '—'}</p>
                          <p className="text-xs text-slate-500">ID: {patient.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-300 mb-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {patient.phone}
                      </div>
                      {patient.email ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          {patient.email}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 italic">No email</div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-sm text-slate-400">
                      {new Date(patient.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        patient.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        {/* ── Send OTP via Email ── */}
                        <button
                          onClick={() => openOtpModal(patient)}
                          disabled={!patient.email}
                          title={patient.email ? `Send OTP to ${patient.email}` : 'No email registered'}
                          className={`p-2 rounded-lg transition-colors
                            ${patient.email
                              ? 'hover:bg-slate-700 text-cyan-400 hover:text-cyan-300'
                              : 'text-slate-700 cursor-not-allowed'
                            }`}
                        >
                          {otpSentFor === patient.id
                            ? <Clock className="w-4 h-4 text-emerald-400" />
                            : <Send className="w-4 h-4" />
                          }
                        </button>

                        {/* ── Edit ── */}
                        <button
                          onClick={() => openEditModal(patient)}
                          title="Edit patient"
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* ── Deactivate ── */}
                        <button
                          onClick={() => handleDelete(patient.id, patient.full_name || '')}
                          disabled={deleteLoading === patient.id}
                          title="Deactivate patient"
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {deleteLoading === patient.id
                            ? <div className="w-4 h-4 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + Math.max(1, pagination.currentPage - 2);
                if (page > pagination.totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === pagination.currentPage
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">
                {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  disabled={!!selectedPatient}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100
                             placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100
                             placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100
                             placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    selectedPatient ? 'Update Patient' : 'Create Patient'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Confirm Modal */}
      {otpTarget && (
        <OTPConfirmModal
          patient={otpTarget}
          onConfirm={handleSendOTP}
          onCancel={() => setOtpTarget(null)}
          loading={otpLoading}
        />
      )}
    </div>
  );
};

export default Patients;
