import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope, Plus, Edit2, Search, Mail, Phone, X, AlertCircle,
  ChevronLeft, ChevronRight, Star, Calendar, IndianRupee, Clock,
  Video, MapPin, Tag, Upload, Loader2
} from 'lucide-react';
import { expertService } from '../services/expert.service';
import { Expert, Pagination } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600', 'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-700', 'from-rose-500 to-pink-700', 'from-amber-500 to-orange-700',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const COMMON_SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Neurologist','Orthopedic',
  'Pediatrician','Psychiatrist','Gynecologist','Ophthalmologist','ENT Specialist',
  'Endocrinologist','Urologist','Pulmonologist','Oncologist','Gastroenterologist','Rheumatologist',
];
const IS = 'w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors';
const getInitials = (n?: string) => n ? n.split(' ').map(x => x[0]).join('').substring(0,2).toUpperCase() : 'DR';

// ─── Image Upload ─────────────────────────────────────────────────────────────
const ImageUpload: React.FC<{
  value: string;
  onChange: (base64: string) => void;
  label?: string;
}> = ({ value, onChange, label = 'Profile Photo' }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2 MB');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-800/60">
          {value ? (
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <Upload className="w-6 h-6" />
            </div>
          )}
        </div>
        {/* Buttons */}
        <div className="flex flex-col gap-2 flex-1">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Processing...' : 'Upload Photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); if (ref.current) ref.current.value = ''; }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove photo
            </button>
          )}
          <p className="text-[10px] text-slate-500">JPG, PNG or WebP · max 2 MB</p>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handleFile} />
    </div>
  );
};

// ─── Availability Editor ──────────────────────────────────────────────────────
type AvailSlot = { day_of_week: number; start_time: string; end_time: string; mode: string };

// Combined mode value: 'online' | 'inperson' | 'both' | 'not_available'
const MODE_OPTIONS = [
  { value: 'online',        label: ' Online only',             color: 'text-blue-400',  bg: 'bg-blue-500/5  border-blue-500/20'  },
  { value: 'inperson',      label: ' In-Person only',          color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20' },
  { value: 'both',          label: ' Both (Online + In-Person)', color: 'text-cyan-400',  bg: 'bg-cyan-500/5  border-cyan-500/20'  },
  { value: 'not_available', label: ' Not Available',            color: 'text-red-400',   bg: 'bg-red-500/5   border-red-500/20'   },
];

const AvailabilityEditor: React.FC<{
  availability: AvailSlot[];
  onChange: (a: AvailSlot[]) => void;
}> = ({ availability, onChange }) => {

  const toggle = (dow: number) => {
    if (availability.find(a => a.day_of_week === dow)) {
      onChange(availability.filter(a => a.day_of_week !== dow));
    } else {
      onChange([...availability, { day_of_week: dow, start_time: '09:00', end_time: '17:00', mode: 'online' }]
        .sort((a, b) => a.day_of_week - b.day_of_week));
    }
  };

  // Single dropdown handler: mode stored directly including 'not_available'
  const handleModeChange = (dow: number, val: string) => {
    onChange(availability.map(a => a.day_of_week === dow
      ? { ...a, mode: val }
      : a
    ));
  };

  const updateTime = (dow: number, field: 'start_time' | 'end_time', val: string) =>
    onChange(availability.map(a => a.day_of_week === dow ? { ...a, [field]: val } : a));

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Weekly Availability</label>

      {/* Day toggle chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {DAYS_FULL.map((day, dow) => {
          const slot = availability.find(a => a.day_of_week === dow);
          const isSet = !!slot;
          const isNA = slot?.mode === 'not_available';
          return (
            <button key={dow} type="button" onClick={() => toggle(dow)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                isNA  ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                isSet ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' :
                        'bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-600'
              }`}>{day.slice(0, 3)}</button>
          );
        })}
      </div>

      {availability.length === 0 && (
        <p className="text-xs text-slate-500 italic mb-2">Click a day above to add it. Unset days default to 9 AM-5 PM.</p>
      )}

      {/* Per-day rows */}
      <div className="space-y-2">
        {[...availability].sort((a, b) => a.day_of_week - b.day_of_week).map(av => {
          const modeVal = av.mode || 'online';
          const modeInfo = MODE_OPTIONS.find(m => m.value === modeVal) || MODE_OPTIONS[0];
          return (
            <div key={av.day_of_week} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border flex-wrap ${modeInfo.bg}`}>
              {/* Day label */}
              <span className={`text-xs font-bold w-8 flex-shrink-0 ${modeInfo.color}`}>
                {DAYS_FULL[av.day_of_week].slice(0, 3)}
              </span>

              {/* Unified mode dropdown */}
              <select
                value={modeVal}
                onChange={e => handleModeChange(av.day_of_week, e.target.value)}
                className={`bg-slate-900 border rounded px-2 py-1 text-xs font-medium focus:outline-none flex-shrink-0 ${
                  modeVal === 'not_available' ? 'border-red-500/40 text-red-400' :
                  modeVal === 'online'        ? 'border-blue-500/40 text-blue-400' :
                  modeVal === 'inperson'      ? 'border-green-500/40 text-green-400' :
                                               'border-cyan-500/40 text-cyan-400'
                }`}
              >
                {MODE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Time range — hidden when not available */}
              {av.mode !== 'not_available' && (
                <>
                  <input type="time" value={av.start_time}
                    onChange={e => updateTime(av.day_of_week, 'start_time', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 [color-scheme:dark] focus:outline-none focus:border-cyan-500 flex-shrink-0" />
                  <span className="text-slate-500 text-xs">—</span>
                  <input type="time" value={av.end_time}
                    onChange={e => updateTime(av.day_of_week, 'end_time', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 [color-scheme:dark] focus:outline-none focus:border-cyan-500 flex-shrink-0" />
                </>
              )}

              {/* Remove button */}
              <button type="button" onClick={() => toggle(av.day_of_week)}
                className="ml-auto text-slate-600 hover:text-red-400 transition-colors text-xs px-1.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Shared Sub-components ────────────────────────────────────────────────────
const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </div>
  </div>
);
const FF: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div><label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>{children}</div>
);
const FE: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />{message}
  </div>
);
const MA: React.FC<{ onCancel: () => void; loading: boolean; label: string }> = ({ onCancel, loading, label }) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancel</button>
    <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : label}
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
type CreateForm = {
  full_name: string; phone: string; email: string; password: string; bio: string;
  experience_years: number; profile_image: string;
  specializations: string[];
  online_price: string | number; inperson_price: string | number;
  availability: AvailSlot[];
};
type EditForm = {
  bio: string; experience_years: number; is_active: boolean; profile_image: string;
  specializations: string[];
  online_price: string | number; inperson_price: string | number;
  availability: AvailSlot[];
};

const EMPTY_CREATE: CreateForm = {
  full_name:'', phone:'', email:'', password:'', bio:'', experience_years:0,
  profile_image:'', specializations:[], online_price:'', inperson_price:'', availability:[],
};
const EMPTY_EDIT: EditForm = {
  bio:'', experience_years:0, is_active:true, profile_image:'',
  specializations:[], online_price:'', inperson_price:'', availability:[],
};

const Experts: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  const [createForm, setCreateForm] = useState<CreateForm>({ ...EMPTY_CREATE });
  const [editForm, setEditForm]     = useState<EditForm>({ ...EMPTY_EDIT });
  const [customSpec, setCustomSpec] = useState('');
  const [formError, setFormError]   = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPagination(p => ({ ...p, currentPage: 1 })); }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { loadExperts(); }, [pagination.currentPage, debouncedSearch]);

  const loadExperts = async () => {
    try {
      setLoading(true);
      const res = await expertService.getAll(pagination.currentPage, 12, debouncedSearch);
      setExperts(res.data.experts || []);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // ── Modals ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setCreateForm({ ...EMPTY_CREATE });
    setCustomSpec(''); setFormError(''); setShowCreate(true);
  };

  const openEdit = async (expert: Expert) => {
    setSelectedExpert(expert);
    const populate = (e: Expert) => setEditForm({
      bio: e.bio || '',
      experience_years: e.experience_years || 0,
      is_active: e.is_active !== false,
      profile_image: e.profile_image || '',
      specializations: e.specializations || [],
      online_price:   e.pricing?.find(p => p.mode === 'online')?.price   ?? '',
      inperson_price: e.pricing?.find(p => p.mode === 'inperson')?.price ?? '',
      availability: (e.availability || []).map((a: any) => ({
        day_of_week: a.day_of_week,
        start_time: (a.start_time || '09:00').slice(0, 5),
        end_time:   (a.end_time   || '17:00').slice(0, 5),
        mode: a.mode || 'online',
      })),
    });
    populate(expert);
    setCustomSpec(''); setFormError(''); setShowEdit(true);
    try { const r = await expertService.getById(expert.id); populate(r.data); setSelectedExpert(r.data); } catch {}
  };

  const openDetail = async (expert: Expert) => {
    setSelectedExpert(expert); setShowDetail(true);
    try { const r = await expertService.getById(expert.id); setSelectedExpert(r.data); } catch {}
  };

  // ── Spec toggles ──────────────────────────────────────────────────────────
  const toggleSpecC = (s: string) => setCreateForm(f => ({
    ...f, specializations: f.specializations.includes(s) ? f.specializations.filter(x => x !== s) : [...f.specializations, s],
  }));
  const toggleSpecE = (s: string) => setEditForm(f => ({
    ...f, specializations: f.specializations.includes(s) ? f.specializations.filter(x => x !== s) : [...f.specializations, s],
  }));
  const addCustomSpec = (toggle: (s: string) => void) => {
    if (customSpec.trim()) { toggle(customSpec.trim()); setCustomSpec(''); }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormLoading(true);
    try {
      await expertService.create({
        full_name:        createForm.full_name,
        phone:            createForm.phone,
        email:            createForm.email,
        password:         createForm.password,
        bio:              createForm.bio || null,
        experience_years: createForm.experience_years || null,
        profile_image:    createForm.profile_image || null,
        specializations:  createForm.specializations,
        online_price:     createForm.online_price   !== '' ? Number(createForm.online_price)   : null,
        inperson_price:   createForm.inperson_price !== '' ? Number(createForm.inperson_price) : null,
        availability:     createForm.availability,
      });
      setShowCreate(false); loadExperts();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create expert';
      console.error('[create]', err.response?.data || err);
      setFormError(msg);
    } finally { setFormLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpert) return;
    setFormError(''); setFormLoading(true);
    try {
      await expertService.update(selectedExpert.id, {
        bio:              editForm.bio || null,
        experience_years: editForm.experience_years,
        is_active:        editForm.is_active,
        profile_image:    editForm.profile_image || null,
        specializations:  editForm.specializations,
        online_price:     editForm.online_price   !== '' ? Number(editForm.online_price)   : null,
        inperson_price:   editForm.inperson_price !== '' ? Number(editForm.inperson_price) : null,
        availability:     editForm.availability,
      });
      setShowEdit(false); loadExperts();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update expert';
      console.error('[edit]', err.response?.data || err);
      setFormError(msg);
    } finally { setFormLoading(false); }
  };

  // ── Spec picker UI (reused in both modals) ────────────────────────────────
  const SpecPicker = ({ selected, toggle }: { selected: string[]; toggle: (s: string) => void }) => (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {COMMON_SPECIALIZATIONS.map(s => (
          <button key={s} type="button" onClick={() => toggle(s)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              selected.includes(s)
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={customSpec} onChange={e => setCustomSpec(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSpec(toggle))}
          placeholder="Custom specialization..." className={`${IS} flex-1`} />
        <button type="button" onClick={() => addCustomSpec(toggle)}
          className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Add</button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(s => (
            <span key={s} className="flex items-center gap-1 text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-white">x</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Experts & Doctors</h1>
        <p className="text-slate-400 text-sm mt-1">{pagination.totalItems} healthcare professionals</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search by name..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500" />
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Expert
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
            {experts.map((expert, idx) => {
              const onlineP = expert.pricing?.find(p => p.mode === 'online')?.price;
              const inpersonP = expert.pricing?.find(p => p.mode === 'inperson')?.price;
              return (
                <div key={expert.id}
                  className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-800/60 group cursor-pointer transition-all"
                  onClick={() => openDetail(expert)}>
                  <div className="flex items-start justify-between mb-3">
                    {expert.profile_image ? (
                      <img src={expert.profile_image} alt={expert.full_name}
                        className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-slate-700 flex-shrink-0" />
                    ) : (
                      <div className={`w-14 h-14 bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
                        {getInitials(expert.full_name)}
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); openEdit(expert); }}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-white text-base mb-0.5 truncate">{expert.full_name || 'Unnamed'}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-400">{expert.experience_years || 0} yrs experience</span>
                  </div>

                  {(expert.specializations || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {expert.specializations!.slice(0, 2).map(s => (
                        <span key={s} className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {expert.specializations!.length > 2 && (
                        <span className="text-[10px] text-slate-500">+{expert.specializations!.length - 2}</span>
                      )}
                    </div>
                  )}

                  {(onlineP != null || inpersonP != null) && (
                    <div className="flex gap-2 mb-3">
                      {onlineP != null && <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-2 py-0.5 text-[10px]"><Video className="w-3 h-3" />₹{onlineP}</span>}
                      {inpersonP != null && <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded px-2 py-0.5 text-[10px]"><MapPin className="w-3 h-3" />₹{inpersonP}</span>}
                    </div>
                  )}

                  <div className="space-y-1 mb-3">
                    {expert.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{expert.email}</span></div>}
                    {expert.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{expert.phone}</div>}
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-400">{expert.total_appointments || 0}</span>
                      <span className="text-xs text-slate-500">sessions</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${expert.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {expert.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <p className="text-sm text-slate-400">Page {pagination.currentPage} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} disabled={pagination.currentPage === 1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} disabled={pagination.currentPage === pagination.totalPages} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      {showDetail && selectedExpert && (
        <ModalWrapper title={selectedExpert.full_name || 'Expert Profile'} onClose={() => setShowDetail(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {selectedExpert.profile_image ? (
                <img src={selectedExpert.profile_image} alt={selectedExpert.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-700 flex-shrink-0" />
              ) : (
                <div className={`w-20 h-20 bg-gradient-to-br ${AVATAR_COLORS[0]} rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
                  {getInitials(selectedExpert.full_name)}
                </div>
              )}
              <div>
                <h3 className="text-white font-semibold text-lg">{selectedExpert.full_name}</h3>
                <p className="text-slate-400 text-sm">{selectedExpert.experience_years} yrs experience</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${selectedExpert.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {selectedExpert.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {(selectedExpert.specializations || []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Specializations</p>
                <div className="flex flex-wrap gap-1.5">{selectedExpert.specializations!.map(s => <span key={s} className="text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-full">{s}</span>)}</div>
              </div>
            )}
            {selectedExpert.bio && <div><p className="text-xs font-medium text-slate-400 mb-1">About</p><p className="text-sm text-slate-300 leading-relaxed">{selectedExpert.bio}</p></div>}
            {(selectedExpert.pricing || []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />Consultation Fees</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedExpert.pricing!.map(p => (
                    <div key={p.mode} className={`flex items-center gap-2 p-3 rounded-xl border ${p.mode === 'online' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                      {p.mode === 'online' ? <Video className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-green-400" />}
                      <div><p className="text-[10px] text-slate-400 capitalize">{p.mode}</p><p className="text-sm font-semibold text-white">₹{p.price}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(selectedExpert.availability || []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Availability</p>
                <div className="space-y-1.5">
                  {selectedExpert.availability!.map((a, i) => (
                    <div key={i} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${a.mode === 'not_available' ? 'bg-red-500/5 border border-red-500/20' : 'bg-slate-800/50'}`}>
                      <span className="text-slate-300 font-medium">{DAYS_SHORT[a.day_of_week]}</span>
                      {a.mode === 'not_available' ? (
                        <span className="text-xs text-red-400 font-medium">Not Available</span>
                      ) : (
                        <>
                          <span className="text-slate-400">{a.start_time?.slice(0,5)} – {a.end_time?.slice(0,5)}</span>
                          <span className="text-xs text-slate-500 capitalize">{a.mode}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { setShowDetail(false); openEdit(selectedExpert); }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <ModalWrapper title="Add New Expert" onClose={() => setShowCreate(false)}>
          {formError && <FE message={formError} />}
          <form onSubmit={handleCreate} className="space-y-4">
            <ImageUpload
              value={createForm.profile_image}
              onChange={v => setCreateForm(f => ({ ...f, profile_image: v }))}
            />
            <FF label="Full Name *">
              <input type="text" required value={createForm.full_name}
                onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Dr. Jane Smith" className={IS} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Phone *">
                <input type="tel" required value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91..." className={IS} />
              </FF>
              <FF label="Experience (yrs)">
                <input type="number" min="0" value={createForm.experience_years}
                  onChange={e => setCreateForm(f => ({ ...f, experience_years: Number(e.target.value) }))}
                  className={IS} />
              </FF>
            </div>
            <FF label="Email *">
              <input type="email" required value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                placeholder="dr.jane@hospital.com" className={IS} />
            </FF>
            <FF label="Password *">
              <input type="password" required minLength={6} value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters" className={IS} />
            </FF>
            <FF label="Specializations">
              <SpecPicker selected={createForm.specializations} toggle={toggleSpecC} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Online Fee (₹)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="number" min="0" value={createForm.online_price}
                    onChange={e => setCreateForm(f => ({ ...f, online_price: e.target.value }))}
                    placeholder="500" className={`${IS} pl-10`} />
                </div>
              </FF>
              <FF label="In-Person Fee (₹)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="number" min="0" value={createForm.inperson_price}
                    onChange={e => setCreateForm(f => ({ ...f, inperson_price: e.target.value }))}
                    placeholder="700" className={`${IS} pl-10`} />
                </div>
              </FF>
            </div>
            <FF label="Bio">
              <textarea value={createForm.bio} onChange={e => setCreateForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Brief professional description..." rows={3} className={`${IS} resize-none`} />
            </FF>
            <AvailabilityEditor
              availability={createForm.availability}
              onChange={a => setCreateForm(f => ({ ...f, availability: a }))}
            />
            <MA onCancel={() => setShowCreate(false)} loading={formLoading} label="Create Expert" />
          </form>
        </ModalWrapper>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {showEdit && selectedExpert && (
        <ModalWrapper title={`Edit: ${selectedExpert.full_name}`} onClose={() => setShowEdit(false)}>
          {formError && <FE message={formError} />}
          <form onSubmit={handleEdit} className="space-y-4">
            <ImageUpload
              value={editForm.profile_image}
              onChange={v => setEditForm(f => ({ ...f, profile_image: v }))}
            />
            <FF label="Specializations">
              <SpecPicker selected={editForm.specializations} toggle={toggleSpecE} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Online Fee (₹)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="number" min="0" value={editForm.online_price}
                    onChange={e => setEditForm(f => ({ ...f, online_price: e.target.value }))}
                    placeholder="500" className={`${IS} pl-10`} />
                </div>
              </FF>
              <FF label="In-Person Fee (₹)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="number" min="0" value={editForm.inperson_price}
                    onChange={e => setEditForm(f => ({ ...f, inperson_price: e.target.value }))}
                    placeholder="700" className={`${IS} pl-10`} />
                </div>
              </FF>
            </div>
            <FF label="Experience (years)">
              <input type="number" min="0" value={editForm.experience_years}
                onChange={e => setEditForm(f => ({ ...f, experience_years: Number(e.target.value) }))}
                className={IS} />
            </FF>
            <FF label="Bio">
              <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                rows={3} className={`${IS} resize-none`} />
            </FF>
            <FF label="Status">
              <select value={editForm.is_active ? 'true' : 'false'}
                onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                className={IS}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </FF>
            <AvailabilityEditor
              availability={editForm.availability}
              onChange={a => setEditForm(f => ({ ...f, availability: a }))}
            />
            <MA onCancel={() => setShowEdit(false)} loading={formLoading} label="Save Changes" />
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default Experts;
