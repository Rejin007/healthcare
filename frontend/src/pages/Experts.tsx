import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Plus, Edit2, Search, Mail, Phone,
  X, AlertCircle, ChevronLeft, ChevronRight, Star, Calendar
} from 'lucide-react';
import { expertService } from '../services/expert.service';
import { Expert, Pagination } from '../types';

const Experts: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  const [createForm, setCreateForm] = useState({
    full_name: '', phone: '', email: '', password: '', bio: '', experience_years: 0
  });
  const [editForm, setEditForm] = useState({
    bio: '', experience_years: 0, is_active: true
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(p => ({ ...p, currentPage: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadExperts();
  }, [pagination.currentPage, debouncedSearch]);

  const loadExperts = async () => {
    try {
      setLoading(true);
      const response = await expertService.getAll(pagination.currentPage, 12, debouncedSearch);
      setExperts(response.data.experts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load experts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm({ full_name: '', phone: '', email: '', password: '', bio: '', experience_years: 0 });
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (expert: Expert) => {
    setSelectedExpert(expert);
    setEditForm({
      bio: expert.bio || '',
      experience_years: expert.experience_years || 0,
      is_active: expert.is_active !== false
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await expertService.create(createForm);
      setShowCreateModal(false);
      loadExperts();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to create expert');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpert) return;
    setFormError('');
    setFormLoading(true);
    try {
      await expertService.update(selectedExpert.id, editForm);
      setShowEditModal(false);
      loadExperts();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to update expert');
    } finally {
      setFormLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const avatarColors = [
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-700',
    'from-emerald-500 to-teal-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-700',
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Experts & Doctors</h1>
        <p className="text-slate-400 text-sm mt-1">{pagination.totalItems} healthcare professionals</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm
                         text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Expert
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
          </div>
        ) : experts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Stethoscope className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{debouncedSearch ? 'No experts match your search' : 'No experts added yet'}</p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {experts.map((expert, idx) => (
              <div
                key={expert.id}
                className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition-all hover:bg-slate-800/60 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
                    {getInitials(expert.full_name)}
                  </div>
                  <button
                    onClick={() => openEditModal(expert)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-semibold text-white text-base mb-1 truncate">{expert.full_name || 'Unnamed'}</h3>

                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-slate-400">
                    {expert.experience_years || 0} yrs experience
                  </span>
                </div>

                {expert.bio && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{expert.bio}</p>
                )}

                <div className="space-y-1.5 mb-4">
                  {expert.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{expert.email}</span>
                    </div>
                  )}
                  {expert.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      {expert.phone}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">{expert.total_appointments || 0}</span>
                    <span className="text-xs text-slate-500">sessions</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    expert.is_active !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {expert.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <p className="text-sm text-slate-400">Page {pagination.currentPage} of {pagination.totalPages}</p>
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <ModalWrapper title="Add New Expert" onClose={() => setShowCreateModal(false)}>
          {formError && <FormError message={formError} />}
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label="Full Name *">
              <input
                type="text" required value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Dr. Jane Smith"
                className="input-style"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Phone *">
                <input
                  type="tel" required value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+91..."
                  className="input-style"
                />
              </FormField>
              <FormField label="Experience (yrs) *">
                <input
                  type="number" required min="0" value={createForm.experience_years}
                  onChange={(e) => setCreateForm({ ...createForm, experience_years: Number(e.target.value) })}
                  className="input-style"
                />
              </FormField>
            </div>
            <FormField label="Email *">
              <input
                type="email" required value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="dr.jane@hospital.com"
                className="input-style"
              />
            </FormField>
            <FormField label="Password *">
              <input
                type="password" required minLength={6} value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min 6 characters"
                className="input-style"
              />
            </FormField>
            <FormField label="Bio">
              <textarea
                value={createForm.bio}
                onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                placeholder="Brief professional description..."
                rows={3}
                className="input-style resize-none"
              />
            </FormField>
            <ModalActions
              onCancel={() => setShowCreateModal(false)}
              loading={formLoading}
              submitLabel="Create Expert"
            />
          </form>
        </ModalWrapper>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedExpert && (
        <ModalWrapper title={`Edit: ${selectedExpert.full_name}`} onClose={() => setShowEditModal(false)}>
          {formError && <FormError message={formError} />}
          <form onSubmit={handleEdit} className="space-y-4">
            <FormField label="Experience (years)">
              <input
                type="number" min="0" value={editForm.experience_years}
                onChange={(e) => setEditForm({ ...editForm, experience_years: Number(e.target.value) })}
                className="input-style"
              />
            </FormField>
            <FormField label="Bio">
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="input-style resize-none"
              />
            </FormField>
            <FormField label="Status">
              <select
                value={editForm.is_active ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                className="input-style"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </FormField>
            <ModalActions
              onCancel={() => setShowEditModal(false)}
              loading={formLoading}
              submitLabel="Save Changes"
            />
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

// Reusable sub-components
const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    {children}
  </div>
);

const FormError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
    {message}
  </div>
);

const ModalActions: React.FC<{ onCancel: () => void; loading: boolean; submitLabel: string }> = ({ onCancel, loading, submitLabel }) => (
  <div className="flex gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
      ) : submitLabel}
    </button>
  </div>
);

// CSS injection for input-style (can't use @apply in .tsx)
const style = document.createElement('style');
style.textContent = `.input-style { width: 100%; background: rgba(15,23,42,0.8); border: 1px solid #334155; border-radius: 0.5rem; padding: 0.625rem 1rem; color: #e2e8f0; font-size: 0.875rem; outline: none; transition: all 0.2s; }
.input-style:focus { border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6,182,212,0.2); }
.input-style::placeholder { color: #64748b; }`;
document.head.appendChild(style);

export default Experts;
