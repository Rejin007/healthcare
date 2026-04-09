import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Plus, X, AlertCircle, User, Stethoscope,
  RefreshCw, ChevronLeft, ChevronRight, CheckCircle, Search,
  Phone, Mail, IndianRupee, Video, MapPin, ArrowLeft, ArrowRight,
  UserPlus, CalendarDays, Loader2, Pencil, Ban, Monitor, Hospital,
  Banknote, Smartphone, CreditCard, ShieldCheck, Copy, ExternalLink, Link2
} from 'lucide-react';
import api from '../services/api';
import { appointmentService } from '../services/appointment.service';
import { expertService } from '../services/expert.service';
import { patientService } from '../services/patient.service';
import { paymentService } from '../services/payment.service';
import { Appointment, Expert, Patient, Pagination, TimeSlot } from '../types';

type StatusFilter = 'all' | 'upcoming' | 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
type BookingStep = 1 | 2 | 3 | 4 | 5;
type PaymentMethod = 'cash' | 'upi' | 'card' | 'insurance';

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_CLASSES: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  completed: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  'no-show': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
];

function getInitials(name?: string) {
  if (!name) return 'PT';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function generateSlots(availStart: string, availEnd: string, bookedSlots: { start_time: string; end_time: string }[], slotMinutes = 30): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [sh, sm] = availStart.split(':').map(Number);
  const [eh, em] = availEnd.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  for (let m = startMins; m + slotMinutes <= endMins; m += slotMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const label = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const isBooked = bookedSlots.some(b => {
      const bs = new Date(b.start_time);
      const be = new Date(b.end_time);
      const slotStart = new Date(`2000-01-01T${timeStr}`);
      const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
      const bsMin = bs.getHours() * 60 + bs.getMinutes();
      const beMin = be.getHours() * 60 + be.getMinutes();
      const ssMin = slotStart.getHours() * 60 + slotStart.getMinutes();
      const seMin = slotEnd.getHours() * 60 + slotEnd.getMinutes();
      return ssMin < beMin && seMin > bsMin;
    });
    slots.push({ time: timeStr, label, available: !isBooked });
  }
  return slots;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Sub-components ──────────────────────────────────────────────────────────
const InputStyle = "w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors";

const StepIndicator: React.FC<{ step: BookingStep; labels: string[] }> = ({ step, labels }) => (
  <div className="flex items-center justify-center gap-0 mb-6">
    {labels.map((label, i) => {
      const s = (i + 1) as BookingStep;
      const done = step > s;
      const active = step === s;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
              done ? 'bg-cyan-500 border-cyan-500 text-white' :
              active ? 'bg-transparent border-cyan-500 text-cyan-400' :
              'bg-transparent border-slate-600 text-slate-500'
            }`}>
              {done ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            <span className={`text-[10px] font-medium hidden sm:block ${active ? 'text-cyan-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-4 transition-colors ${done ? 'bg-cyan-500' : 'bg-slate-700'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);


// ─── CalendarPicker ──────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WDAYS  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const CalendarPicker: React.FC<{
  value: string;
  onChange: (date: string) => void;
  availability: any[];
  selectedMode: string;
  month: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
  bookedDates?: string[];
}> = ({ value, onChange, availability, selectedMode, month, onMonthChange, bookedDates = [] }) => {

  const today = new Date(); today.setHours(0,0,0,0);

  const getDayStatus = (dow: number) => {
    const rows = availability.filter((a: any) => Number(a.day_of_week) === dow);
    if (!rows.length) return 'default';
    if (rows.some((a: any) => a.mode === 'not_available')) return 'na';
    if (rows.some((a: any) => a.mode === selectedMode || a.mode === 'both')) return 'ok';
    return 'wm';
  };

  const firstDay = new Date(month.year, month.month, 1);
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const startPad = firstDay.getDay();
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => month.month === 0
    ? onMonthChange({ year: month.year - 1, month: 11 })
    : onMonthChange({ year: month.year, month: month.month - 1 });

  const next = () => month.month === 11
    ? onMonthChange({ year: month.year + 1, month: 0 })
    : onMonthChange({ year: month.year, month: month.month + 1 });

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev}
          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[month.month]} {month.year}
        </span>
        <button type="button" onClick={next}
          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] text-slate-500 py-0.5">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(month.year, month.month, day);
          date.setHours(0, 0, 0, 0);
          const dateStr = `${month.year}-${String(month.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isPast = date < today;
          const isToday = date.getTime() === today.getTime();
          const isSelected = value === dateStr;
          const status = getDayStatus(date.getDay());
          const alreadyBooked = bookedDates.includes(dateStr);
          const disabled = isPast || status === 'na' || status === 'wm' || alreadyBooked;

          let cls = 'relative flex items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all ';
          if (isSelected)          cls += 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ';
          else if (alreadyBooked && !isPast)
                                   cls += 'bg-violet-500/10 text-violet-400/50 cursor-not-allowed ';
          else if (status === 'na' && !isPast)
                                   cls += 'bg-red-500/10 text-red-400/50 line-through cursor-not-allowed ';
          else if (status === 'wm' && !isPast)
                                   cls += 'bg-amber-500/5 text-amber-400/40 cursor-not-allowed ';
          else if (isPast)         cls += 'text-slate-700 cursor-not-allowed ';
          else if (status === 'ok') cls += `text-emerald-300 hover:bg-emerald-500/20 cursor-pointer ${isToday ? 'ring-1 ring-emerald-400' : ''} `;
          else                     cls += `text-slate-300 hover:bg-slate-700 cursor-pointer ${isToday ? 'ring-1 ring-slate-500' : ''} `;

          return (
            <button key={i} type="button" disabled={disabled}
              onClick={() => !disabled && onChange(dateStr)}
              className={cls}
              title={alreadyBooked ? 'Patient already has appointment this day' : status === 'na' ? 'Doctor not available' : status === 'wm' ? `Only ${selectedMode === 'online' ? 'in-person' : 'online'} available` : undefined}
            >
              {day}
              {status === 'na' && !isPast && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
              {alreadyBooked && !isPast && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-violet-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-emerald-500/30 border border-emerald-400/40 inline-block" />Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-red-500/10 border border-red-400/30 inline-block" />Not Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-amber-500/5 border border-amber-400/20 inline-block" />Wrong mode
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-violet-500/10 border border-violet-400/30 inline-block" />Already booked
        </span>
      </div>
    </div>
  );
};


const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Booking wizard state
  const [step, setStep] = useState<BookingStep>(1);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [expertSearch, setExpertSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMode, setSelectedMode] = useState<'online' | 'inperson'>('online');
  const duration = 30; // fixed 30-minute sessions
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [expertAvailability, setExpertAvailability] = useState<any[]>([]);
  const [patientBookedDates, setPatientBookedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });

  // New patient inline creation
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ phone: '', full_name: '', email: '' });
  const [patientCreateLoading, setPatientCreateLoading] = useState(false);
  const [patientCreateError, setPatientCreateError] = useState('');

  const [meetLink, setMeetLink] = useState('');
  const [editingMeetAppt, setEditingMeetAppt] = useState<string | null>(null);
  const [editingMeetVal, setEditingMeetVal] = useState('');
  const [meetLinkSaving, setMeetLinkSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Payment step state
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => { loadAppointments(); }, [pagination.currentPage, statusFilter]);
  useEffect(() => { loadFormData(); }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (statusFilter === 'upcoming') {
        filters.statuses = 'scheduled,confirmed';
        filters.upcoming = 'true';
      } else if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const response = await appointmentService.getAll(pagination.currentPage, 10, filters);
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMeetLink = async (apptId: string) => {
    const trimmed = editingMeetVal.trim();
    if (!trimmed) return;
    // Basic URL validation
    try {
      const url = new URL(trimmed);
      if (!['http:', 'https:'].includes(url.protocol)) {
        alert('Please enter a valid URL starting with https://');
        return;
      }
    } catch {
      alert('Please enter a valid URL (e.g. https://meet.google.com/xxx-xxx-xxx)');
      return;
    }
    setMeetLinkSaving(true);
    try {
      await appointmentService.updateMeetLink(apptId, trimmed);
      setEditingMeetAppt(null);
      setEditingMeetVal('');
      loadAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update meet link');
    } finally {
      setMeetLinkSaving(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [expertsRes, patientsRes] = await Promise.all([
        expertService.getAll(1, 100),
        patientService.getAll(1, 200),
      ]);
      setExperts(expertsRes.data.experts || []);
      setPatients(patientsRes.data.patients || []);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const resetBooking = useCallback(() => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedExpert(null);
    setSelectedDate('');
    setSelectedSlot('');
    setSelectedMode('online');
    setSlots([]);
    setExpertAvailability([]);
    setMeetLink('');
    setPatientBookedDates([]);
    setCalendarMonth(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
    setPatientSearch('');
    setExpertSearch('');
    setCreatingPatient(false);
    setNewPatient({ phone: '', full_name: '', email: '' });
    setPatientCreateError('');
    setFormError('');
    setSuccessMsg('');
    // Payment step reset
    setPendingPaymentId(null);
    setPendingAmount(0);
    setSelectedPaymentMethod('cash');
    setPaymentLoading(false);
  }, []);

  const openModal = () => {
    resetBooking();
    loadFormData(); // refresh lists on each open to capture recent additions
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetBooking();
  };

  // ── Step 1: Create new patient inline ─────────────────────────────────────
  const handleCreatePatient = async () => {
    if (!newPatient.phone) { setPatientCreateError('Phone is required'); return; }
    setPatientCreateLoading(true);
    setPatientCreateError('');
    try {
      const res = await patientService.create(newPatient);
      const created: Patient = res.data;
      setPatients(prev => [created, ...prev]);
      setSelectedPatient(created);
      setCreatingPatient(false);
      setNewPatient({ phone: '', full_name: '', email: '' });
    } catch (err: any) {
      setPatientCreateError(err.response?.data?.message || 'Failed to create patient');
    } finally {
      setPatientCreateLoading(false);
    }
  };

  // Fetch patient's already-booked dates whenever patient is selected
  useEffect(() => {
    if (!selectedPatient) { setPatientBookedDates([]); return; }
    appointmentService.getAll(1, 200, { user_id: selectedPatient.id } as any)
      .then((res: any) => {
        const appts = res.data?.appointments || [];
        const dates: string[] = appts
          .filter((a: any) => !['cancelled', 'no-show'].includes(a.status))
          .map((a: any) => {
            const d = new Date(a.start_time);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          });
        setPatientBookedDates([...new Set<string>(dates)]);
      })
      .catch(() => setPatientBookedDates([]));
  }, [selectedPatient]);

  // ── Step 3: Fetch expert availability schedule when expert chosen ──────────
  useEffect(() => {
    if (!selectedExpert) return;
    setExpertAvailability([]);
    expertService.getById(selectedExpert.id)
      .then((res: any) => setExpertAvailability(res.data?.availability || []))
      .catch(() => setExpertAvailability([]));
  }, [selectedExpert]);

  // ── Step 3: Load slots when date/expert/mode changes ─────────────────────
  useEffect(() => {
    if (!selectedExpert || !selectedDate) return;
    loadSlots();
  }, [selectedExpert, selectedDate, selectedMode]);

  const loadSlots = async () => {
    if (!selectedExpert || !selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot('');
    try {
      const dow = new Date(selectedDate + 'T12:00:00').getDay();

      // Use expertAvailability (fetched from getById) — contains day_of_week reliably
      const dayAvail = expertAvailability.filter((a: any) => Number(a.day_of_week) === dow);

      // 1. Doctor marked this day as not available
      if (dayAvail.some((a: any) => a.mode === 'not_available')) {
        setSlots([{ time: '__na__', label: 'Not available', available: false }]);
        return;
      }

      // 2. Doctor has schedule this day but not for the selected mode
      const modeSlots = dayAvail.filter((a: any) => a.mode === selectedMode || a.mode === 'both');
      if (dayAvail.length > 0 && modeSlots.length === 0) {
        setSlots([{ time: '__wm__', label: 'Mode unavailable', available: false }]);
        return;
      }

      // 3. Fetch only the booked slots for conflict checking
      const res = await appointmentService.getAvailableSlots(selectedExpert.id, selectedDate);
      const bookedSlots = res.data?.bookedSlots || [];

      // 4. Generate time slots from the expert's availability window (or 9-6 default)
      const windows = modeSlots.length > 0
        ? modeSlots
        : [{ start_time: '09:00', end_time: '18:00' }];

      const allSlots: TimeSlot[] = [];
      windows.forEach((avail: any) => {
        allSlots.push(...generateSlots(avail.start_time, avail.end_time, bookedSlots, 30));
      });
      setSlots(allSlots);
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setSlotsLoading(false);
    }
  };;

  // ── Step 4 → 5: Create appointment, then proceed to payment ──────────────
  const handleBookingCreate = async () => {
    if (!selectedPatient || !selectedExpert || !selectedDate || !selectedSlot) {
      setFormError('Please complete all steps'); return;
    }
    setFormError('');
    setFormLoading(true);
    try {
      const startTime = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      const res = await appointmentService.create({
        user_id: selectedPatient.id,
        expert_id: selectedExpert.id,
        mode: selectedMode,
        start_time: startTime,
        duration,
        meet_link: selectedMode === 'online' ? meetLink || null : null,
      });
      const { paymentId, amount } = res.data || {};
      setPendingPaymentId(paymentId || null);
      setPendingAmount(amount || 0);
      setStep(5);
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to create appointment');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Step 5: Collect payment → auto-confirms appointment ───────────────────
  const handlePaymentComplete = async () => {
    if (!pendingPaymentId) return;
    setPaymentLoading(true);
    setFormError('');
    try {
      await paymentService.updateStatus(pendingPaymentId, 'completed');
      setSuccessMsg(
        `CONFIRMED: Appointment confirmed! ₹${pendingAmount} collected via ${selectedPaymentMethod.toUpperCase()}.`
      );
      setTimeout(() => { closeModal(); loadAppointments(); }, 2400);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Step 5: Skip payment — appointment stays "scheduled" ──────────────────
  const handleSkipPayment = () => {
    setSuccessMsg(
      `BOOKED: Appointment booked for ${selectedPatient?.full_name || selectedPatient?.phone}. Payment of ₹${pendingAmount} is pending.`
    );
    setTimeout(() => { closeModal(); loadAppointments(); }, 2400);
  };

  // ── Status change ─────────────────────────────────────────────────────────
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

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return !q || (p.full_name || '').toLowerCase().includes(q) || p.phone.includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const filteredExperts = experts.filter(e => {
    const q = expertSearch.toLowerCase();
    return !q || (e.full_name || '').toLowerCase().includes(q) || (e.specializations || []).some(s => s.toLowerCase().includes(q));
  });

  const getExpertPrice = (expert: Expert) => {
    if (!expert.pricing) return null;
    const p = expert.pricing.find(pr => pr.mode === selectedMode);
    return p ? p.price : null;
  };

  const statuses: StatusFilter[] = ['all', 'upcoming', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
  const stepLabels = ['Patient', 'Expert', 'Schedule', 'Review', 'Payment'];

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.totalItems} total appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAppointments} className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
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
            {s === 'upcoming' ? <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Upcoming</span> : s === 'all' ? 'All' : s}
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
            <button onClick={openModal} className="mt-4 text-cyan-400 text-sm hover:underline">+ Book one now</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['ID', 'Patient', 'Expert', 'Date & Time', 'Mode', 'Amount', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-mono text-[11px] text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-1 rounded select-all">
                            {appt.id.substring(0, 8)}…
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(appt.id);
                            }}
                            title={`Copy full UUID: ${appt.id}`}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400 transition-all"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
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
                        <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 w-fit ${
                          appt.mode === 'online'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-green-500/10 text-green-400 border-green-500/30'
                        }`}>
                          {appt.mode === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {appt.mode}
                        </span>
                        {appt.mode === 'online' && (
                          editingMeetAppt === appt.id ? (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <input autoFocus type="url"
                                value={editingMeetVal}
                                onChange={e => setEditingMeetVal(e.target.value)}
                                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveMeetLink(appt.id);
                                  if (e.key === 'Escape') { setEditingMeetAppt(null); setEditingMeetVal(''); }
                                }}
                              />
                              <button onClick={() => saveMeetLink(appt.id)} disabled={meetLinkSaving}
                                className="text-[10px] px-2 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 flex-shrink-0">
                                {meetLinkSaving ? '…' : 'Save'}
                              </button>
                              <button onClick={() => { setEditingMeetAppt(null); setEditingMeetVal(''); }}
                                className="text-[10px] px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 flex-shrink-0"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              {appt.google_meet_link ? (
                                <>
                                  <a href={appt.google_meet_link} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:text-blue-100 transition-colors">
                                    <ExternalLink className="w-3 h-3" />Join
                                  </a>
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(appt.google_meet_link!); }}
                                    title="Copy link"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-700/60 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </>
                              ) : null}
                              <button
                                onClick={() => { setEditingMeetAppt(appt.id); setEditingMeetVal(appt.google_meet_link || ''); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-700/80 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                                {appt.google_meet_link ? <><Link2 className="w-3 h-3" /> Change link</> : <><Link2 className="w-3 h-3" /> Set custom link</>}
                              </button>
                            </div>
                          )
                        )}
                      </td>
                      <td className="py-4 px-5 text-sm">
                        {appt.amount ? (
                          <span className="text-emerald-400 font-medium">₹{appt.amount}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_CLASSES[appt.status] || STATUS_CLASSES.scheduled}`}>
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
                            className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                          >
                            <option value="scheduled">Scheduled</option>
                            {/* Confirmed is set automatically after payment — not manually */}
                            {appt.status === 'confirmed' && <option value="confirmed">Confirmed</option>}
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

            {pagination.totalPages > 1 && (
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
          </>
        )}
      </div>

      {/* ═══ BOOKING WIZARD MODAL ═══════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white">Book Appointment</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step === 1 ? 'Select or create a patient' :
                   step === 2 ? 'Choose an expert' :
                   step === 3 ? 'Pick a date & time slot' :
                   step === 4 ? 'Review your booking details' :
                   'Collect payment to confirm appointment'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6">
              <StepIndicator step={step} labels={stepLabels} />

              {/* Success State */}
              {successMsg ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
                    successMsg.startsWith('CONFIRMED')
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}>
                    {successMsg.startsWith('CONFIRMED')
                      ? <CheckCircle className="w-8 h-8 text-emerald-400" />
                      : <Calendar className="w-8 h-8 text-blue-400" />
                    }
                  </div>
                  <p className="text-white font-semibold text-lg">
                    {successMsg.startsWith('CONFIRMED') ? 'Appointment Confirmed!' : 'Appointment Booked!'}
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                    {successMsg.replace(/^(CONFIRMED|BOOKED):\s*/, '')}
                  </p>
                </div>
              ) : (
                <>
                  {/* ── STEP 1: Patient ─────────────────────────────────── */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {!creatingPatient ? (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search patient by name, phone or email..."
                              value={patientSearch}
                              onChange={e => setPatientSearch(e.target.value)}
                              className={`${InputStyle} pl-10`}
                            />
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {filteredPatients.length === 0 && (
                              <p className="text-slate-500 text-sm text-center py-4">No patients found</p>
                            )}
                            {filteredPatients.map((p, idx) => (
                              <button
                                key={p.id}
                                onClick={() => setSelectedPatient(p)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                  selectedPatient?.id === p.id
                                    ? 'bg-cyan-500/10 border-cyan-500/50'
                                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                                }`}
                              >
                                <div className={`w-9 h-9 bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                  {getInitials(p.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{p.full_name || 'No name'}</p>
                                  <p className="text-xs text-slate-500">{p.phone}{p.email ? ` · ${p.email}` : ''}</p>
                                </div>
                                {selectedPatient?.id === p.id && <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => { setCreatingPatient(true); setPatientCreateError(''); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-600 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-xl text-sm text-slate-400 hover:text-cyan-400 transition-all"
                          >
                            <UserPlus className="w-4 h-4" />
                            New patient — create profile now
                          </button>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => setCreatingPatient(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-white">Create New Patient</span>
                          </div>

                          {patientCreateError && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              {patientCreateError}
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone *</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="tel" placeholder="+91 98765 43210"
                                value={newPatient.phone}
                                onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))}
                                className={`${InputStyle} pl-10`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="text" placeholder="Patient's full name"
                                value={newPatient.full_name}
                                onChange={e => setNewPatient(p => ({ ...p, full_name: e.target.value }))}
                                className={`${InputStyle} pl-10`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="email" placeholder="patient@email.com"
                                value={newPatient.email}
                                onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))}
                                className={`${InputStyle} pl-10`}
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleCreatePatient}
                            disabled={patientCreateLoading}
                            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            {patientCreateLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create & Select Patient'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── STEP 2: Expert ──────────────────────────────────── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {/* ① Choose consultation mode first */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Consultation Mode</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(['online', 'inperson'] as const).map(m => (
                            <button key={m}
                              onClick={() => { setSelectedMode(m); setSelectedExpert(null); setSlots([]); setSelectedSlot(''); setExpertAvailability([]); }}
                              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                selectedMode === m
                                  ? m === 'online' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-green-500/10 border-green-500 text-green-400'
                                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}>
                              {m === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                              {m === 'online' ? 'Online / Video' : 'In-Person Visit'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search by name or specialization..."
                          value={expertSearch}
                          onChange={e => setExpertSearch(e.target.value)}
                          className={`${InputStyle} pl-10`}
                        />
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {filteredExperts.length === 0 && (
                          <p className="text-slate-500 text-sm text-center py-4">No experts found</p>
                        )}
                        {filteredExperts.map((ex, idx) => {
                          const price = ex.pricing?.find(p => p.mode === selectedMode)?.price;
                          return (
                            <button
                              key={ex.id}
                              onClick={() => setSelectedExpert(ex)}
                              className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${
                                selectedExpert?.id === ex.id
                                  ? 'bg-cyan-500/10 border-cyan-500/50'
                                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                              }`}
                            >
                              {ex.profile_image ? (
                                <img src={ex.profile_image} alt={ex.full_name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                              ) : (
                                <div className={`w-11 h-11 bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                  {getInitials(ex.full_name)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-white">{ex.full_name || 'Unnamed Expert'}</p>
                                    {ex.experience_years != null && (
                                      <p className="text-xs text-slate-500">{ex.experience_years} yrs experience</p>
                                    )}
                                  </div>
                                  {price != null ? (
                                    <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                                      <IndianRupee className="w-3 h-3" />₹{price}
                                    </span>
                                  ) : null}
                                </div>
                                {(ex.specializations || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {ex.specializations!.map(s => (
                                      <span key={s} className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {ex.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ex.bio}</p>}
                              </div>
                              {selectedExpert?.id === ex.id && <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: Schedule ─────────────────────────────────── */}
                  {step === 3 && (
                    <div className="space-y-4">
                      {/* Date — availability-aware calendar */}
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                          Select Date
                        </label>
                        <CalendarPicker
                          value={selectedDate}
                          onChange={date => { setSelectedDate(date); setSelectedSlot(''); setSlots([]); }}
                          availability={expertAvailability}
                          selectedMode={selectedMode}
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          bookedDates={patientBookedDates}
                        />
                      </div>

                      {/* Slots */}
                      {selectedDate && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            Available Time Slots
                          </label>
                          {slotsLoading ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Checking availability...
                            </div>
                          ) : slots[0]?.time === '__na__' ? (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                              <p className="text-red-400 font-semibold text-sm flex items-center justify-center gap-1"><Ban className="w-4 h-4" /> Doctor Not Available</p>
                              <p className="text-slate-500 text-xs mt-1">{selectedExpert?.full_name} is not available on {DAYS[new Date(selectedDate + 'T12:00:00').getDay()]}s. Please choose another date.</p>
                            </div>
                          ) : slots[0]?.time === '__wm__' ? (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                              <p className="text-amber-400 font-semibold text-sm flex items-center justify-center gap-1">{selectedMode === 'online' ? <Monitor className="w-4 h-4" /> : <Hospital className="w-4 h-4" />} Not available for {selectedMode === 'online' ? 'Online' : 'In-Person'} on this day</p>
                              <p className="text-slate-500 text-xs mt-1 mb-2">{selectedExpert?.full_name} only offers {selectedMode === 'online' ? 'In-Person' : 'Online'} on {DAYS[new Date(selectedDate + 'T12:00:00').getDay()]}s.</p>
                              <button type="button" onClick={() => { setSelectedMode(selectedMode === 'online' ? 'inperson' : 'online'); setSlots([]); setSelectedSlot(''); }}
                                className="text-xs px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors">
                                Switch to {selectedMode === 'online' ? 'In-Person' : 'Online'} →
                              </button>
                            </div>
                          ) : slots.length === 1 && slots[0].time === '__na__' ? (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 text-center">
                              <div className="flex justify-center mb-2"><Ban className="w-8 h-8 text-red-400" /></div>
                              <p className="text-red-400 font-semibold text-sm">Doctor Not Available</p>
                              <p className="text-slate-500 text-xs mt-1">
                                {selectedExpert?.full_name} is not available on {DAYS[new Date(selectedDate+'T12:00:00').getDay()]}s. Choose another date.
                              </p>
                            </div>
                          ) : slots.length === 1 && slots[0].time === '__wm__' ? (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 text-center">
                              <div className="flex justify-center mb-2">{selectedMode === 'online' ? <Monitor className="w-8 h-8 text-amber-400" /> : <Hospital className="w-8 h-8 text-amber-400" />}</div>
                              <p className="text-amber-400 font-semibold text-sm">
                                Not available for {selectedMode === 'online' ? 'Online' : 'In-Person'} on this day
                              </p>
                              <p className="text-slate-500 text-xs mt-1 mb-3">
                                {selectedExpert?.full_name} only offers {selectedMode === 'online' ? 'In-Person' : 'Online'} on {DAYS[new Date(selectedDate+'T12:00:00').getDay()]}s.
                              </p>
                              <button type="button"
                                onClick={() => { setSelectedMode(selectedMode === 'online' ? 'inperson' : 'online'); setSelectedSlot(''); }}
                                className="text-xs px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/20">
                                Switch to {selectedMode === 'online' ? 'In-Person' : 'Online'} →
                              </button>
                            </div>
                          ) : slots.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">Select a date to see available slots</p>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {slots.map(slot => (
                                <button key={slot.time}
                                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                                  disabled={!slot.available}
                                  className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                                    !slot.available ? 'bg-red-500/5 border-red-500/20 text-red-400/50 cursor-not-allowed line-through'
                                    : selectedSlot === slot.time ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400'
                                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-500'
                                  }`}>
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          )}
                          {slots.length > 1 && (
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-500/30 border border-cyan-500 inline-block" />Available</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/10 border border-red-500/20 inline-block" />Booked</span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Meet link — only for online */}
                      {selectedMode === 'online' && selectedSlot && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center justify-between">
                            <span><Video className="w-3.5 h-3.5 inline mr-1" />Meeting Link</span>
                            <span className="text-[10px] text-cyan-500 font-normal">Auto-generated if left blank</span>
                          </label>
                          <input
                            type="url"
                            value={meetLink}
                            onChange={e => setMeetLink(e.target.value)}
                            placeholder="https://meet.google.com/xxx-xxxx-xxx  (optional)"
                            className={InputStyle}
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Leave blank to auto-generate a Jitsi Meet room. Or paste your own Google Meet / Zoom link.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── STEP 4: Review ──────────────────────────────────── */}
                  {step === 4 && (
                    <div className="space-y-4">
                      {formError && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {formError}
                        </div>
                      )}

                      <div className="bg-slate-800/50 rounded-xl border border-slate-700/60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Booking Summary</p>
                        </div>
                        <div className="p-4 space-y-3">
                          <SummaryRow label="Patient" icon={<User className="w-3.5 h-3.5 text-cyan-400" />}>
                            <span className="text-white font-medium">{selectedPatient?.full_name || 'Unknown'}</span>
                            <span className="text-slate-500 text-xs ml-2">{selectedPatient?.phone}</span>
                          </SummaryRow>
                          <SummaryRow label="Expert" icon={<Stethoscope className="w-3.5 h-3.5 text-emerald-400" />}>
                            <span className="text-white font-medium">{selectedExpert?.full_name}</span>
                            {selectedExpert?.experience_years && (
                              <span className="text-slate-500 text-xs ml-2">{selectedExpert.experience_years} yrs</span>
                            )}
                          </SummaryRow>
                          <SummaryRow label="Date & Time" icon={<Calendar className="w-3.5 h-3.5 text-violet-400" />}>
                            <span className="text-white font-medium">
                              {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </span>
                            <span className="text-slate-400 text-sm ml-2 font-medium">
                              {slots.find(s => s.time === selectedSlot)?.label}
                            </span>
                          </SummaryRow>
                          <SummaryRow label="Mode" icon={selectedMode === 'online' ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <MapPin className="w-3.5 h-3.5 text-green-400" />}>
                            <span className="text-white font-medium capitalize">{selectedMode === 'online' ? 'Online / Video Call' : 'In-Person Visit'}</span>
                          </SummaryRow>
                          {selectedMode === 'online' && meetLink && (
                            <SummaryRow label="Meet Link" icon={<Video className="w-3.5 h-3.5 text-blue-400" />}>
                              <a href={meetLink} target="_blank" rel="noreferrer"
                                className="text-blue-400 text-xs underline truncate max-w-[160px] block">{meetLink}</a>
                            </SummaryRow>
                          )}
                          <SummaryRow label="Duration" icon={<Clock className="w-3.5 h-3.5 text-amber-400" />}>
                            <span className="text-white font-medium">{duration} minutes</span>
                          </SummaryRow>
                          {selectedExpert?.pricing && (() => {
                            const p = selectedExpert.pricing!.find(pr => pr.mode === selectedMode);
                            return p ? (
                              <SummaryRow label="Fee" icon={<IndianRupee className="w-3.5 h-3.5 text-emerald-400" />}>
                                <span className="text-emerald-400 font-semibold text-base">₹{p.price}</span>
                              </SummaryRow>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-400">
                        <CreditCard className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <span>Next step: collect payment to confirm this appointment. You can also book now and pay later.</span>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 5: Payment Collection ───────────────────────── */}
                  {step === 5 && (
                    <div className="space-y-5">
                      {formError && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {formError}
                        </div>
                      )}

                      {/* Amount due */}
                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-2xl p-5 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Amount Due</p>
                        <p className="text-4xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                          <IndianRupee className="w-7 h-7" />
                          {pendingAmount}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {selectedPatient?.full_name || selectedPatient?.phone} · {selectedExpert?.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' })} · {slots.find(s => s.time === selectedSlot)?.label}
                        </p>
                      </div>

                      {/* Payment method */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { id: 'cash',      label: 'Cash',      icon: <Banknote className="w-5 h-5" /> },
                            { id: 'upi',       label: 'UPI',       icon: <Smartphone className="w-5 h-5" /> },
                            { id: 'card',      label: 'Card',      icon: <CreditCard className="w-5 h-5" /> },
                            { id: 'insurance', label: 'Insurance', icon: <ShieldCheck className="w-5 h-5" /> },
                          ] as { id: PaymentMethod; label: string; icon: React.ReactNode }[]).map(m => (
                            <button key={m.id}
                              onClick={() => setSelectedPaymentMethod(m.id)}
                              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                selectedPaymentMethod === m.id
                                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}>
                              <span className="text-lg">{m.icon}</span>
                              {m.label}
                              {selectedPaymentMethod === m.id && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="space-y-2 pt-1">
                        <button
                          onClick={handlePaymentComplete}
                          disabled={paymentLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          {paymentLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                            : <><CheckCircle className="w-4 h-4" />Collect ₹{pendingAmount} & Confirm Appointment</>
                          }
                        </button>
                        <button
                          onClick={handleSkipPayment}
                          disabled={paymentLoading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-600 disabled:opacity-60 text-slate-400 rounded-xl text-sm transition-colors"
                        >
                          Book Without Payment (Pay Later)
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 text-center">
                        "Collect &amp; Confirm" marks payment as received and confirms the appointment immediately.
                        "Pay Later" keeps the appointment as <span className="text-blue-400">Scheduled</span> with payment pending.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer nav — hidden on step 5 (payment step has its own buttons) */}
            {!successMsg && step !== 5 && (
              <div className="flex gap-3 p-6 border-t border-slate-800 flex-shrink-0">
                {step > 1 && (
                  <button
                    onClick={() => setStep(s => (s - 1) as BookingStep)}
                    disabled={formLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button
                  onClick={step === 4 ? handleBookingCreate : () => setStep(s => (s + 1) as BookingStep)}
                  disabled={
                    formLoading ||
                    (step === 1 && !selectedPatient) ||
                    (step === 2 && !selectedExpert) ||
                    (step === 3 && (!selectedDate || !selectedSlot || slots[0]?.time === '__na__' || slots[0]?.time === '__wm__'))
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {formLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
                  ) : step === 4 ? (
                    <><IndianRupee className="w-4 h-4" />Proceed to Payment</>
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}
            {/* On step 5, show only a back button in footer */}
            {!successMsg && step === 5 && (
              <div className="flex gap-3 px-6 pb-4 border-t border-slate-800 pt-4 flex-shrink-0">
                <button
                  onClick={() => setStep(4)}
                  disabled={paymentLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
      {icon}
      <span className="text-xs text-slate-500">{label}</span>
    </div>
    <div className="flex items-center flex-1">{children}</div>
  </div>
);

export default Appointments;
