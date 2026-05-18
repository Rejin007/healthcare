import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Video, MapPin, Clock,
  Calendar, Check, Loader2, AlertCircle, IndianRupee, Ban, X
} from 'lucide-react';
import { Expert } from '../../types';
import { appointmentService } from '../../services/appointment.service';

interface SessionDetailsProps {
  expert: Expert;
  user: any;           // ← needed to fetch user's own appointments
  onBack: () => void;
  onNext: (details: SessionDetails) => void;
}

export interface SessionDetails {
  mode: 'online' | 'inperson';
  date: string;       // YYYY-MM-DD
  startTime: string;  // ISO or HH:MM
  endTime: string;
  price: number;
  slotLabel: string;
}

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

// ── Helper: extract YYYY-MM-DD from any time string ─────────────────────────
function extractDate(timeStr: string): string {
  if (!timeStr) return '';
  // Already a YYYY-MM-DD prefix
  if (/^\d{4}-\d{2}-\d{2}/.test(timeStr)) return timeStr.slice(0, 10);
  return '';
}

// ── Which modes does this expert support? ────────────────────────────────────
function expertModes(expert: Expert): { online: boolean; inperson: boolean } {
  let online = false, inperson = false;

  for (const a of expert.availability ?? []) {
    const m = a.mode;
    if (!m || m === 'online' || m === 'both') online   = true;
    if (m === 'inperson'    || m === 'both') inperson = true;
  }
  if ((expert.online_price   ?? 0) > 0) online   = true;
  if ((expert.inperson_price ?? 0) > 0) inperson = true;
  for (const p of expert.pricing ?? []) {
    if (p.mode === 'online'   || p.mode === 'both') online   = true;
    if (p.mode === 'inperson' || p.mode === 'both') inperson = true;
  }
  if (!online && !inperson) online = true;
  return { online, inperson };
}

// ── Is a weekday open for the chosen mode? ───────────────────────────────────
function isDayAvailableForMode(expert: Expert, dow: number, mode: 'online' | 'inperson'): boolean {
  const avail = expert.availability ?? [];
  if (avail.length === 0) return true;
  return avail.some(a => {
    if (a.day_of_week !== dow) return false;
    const m = a.mode;
    if (!m || m === 'both') return true;
    return m === mode;
  });
}

// ── Price resolver ───────────────────────────────────────────────────────────
function resolvePrice(expert: Expert, mode: 'online' | 'inperson'): number {
  if (mode === 'online') {
    return (
      expert.online_price ||
      expert.pricing?.find(p => p.mode === 'online')?.price ||
      expert.pricing?.find(p => p.mode === 'both')?.price ||
      0
    );
  }
  return (
    expert.inperson_price ||
    expert.pricing?.find(p => p.mode === 'inperson')?.price ||
    expert.pricing?.find(p => p.mode === 'both')?.price ||
    0
  );
}

// ── Slot time → readable label ────────────────────────────────────────────────
function formatSlotLabel(slot: any): string {
  if (slot.label) return slot.label;
  const t: string = slot.start_time ?? '';
  if (/^\d{2}:\d{2}/.test(t)) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr   = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  if (!t) return '—';
  return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Ensure full ISO datetime ──────────────────────────────────────────────────
function toISO(timeStr: string, dateStr: string): string {
  if (!timeStr) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}T/.test(timeStr)) return timeStr;
  if (/^\d{2}:\d{2}/.test(timeStr)) return `${dateStr}T${timeStr}`;
  return timeStr;
}

// ── STATUSES that count as "booked" (block rebooking) ────────────────────────
const BOOKED_STATUSES = ['scheduled', 'confirmed', 'in-progress'];

// ── Client-side slot generator ────────────────────────────────────────────────
// Used as a fallback when the backend /available-slots endpoint requires auth
// (e.g. guest booking flow). Generates 30-min slots from the expert's schedule.
function generateSlotsFromAvailability(
  expert: Expert,
  dateStr: string,
  mode: 'online' | 'inperson',
  slotMinutes = 30
): any[] {
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  const rows = (expert.availability ?? []).filter(a => {
    if (Number(a.day_of_week) !== dow) return false;
    if (a.mode === 'not_available') return false;
    if (!a.mode || a.mode === 'both' || a.mode === mode) return true;
    return false;
  });
  if (rows.length === 0) return [];
  const slots: any[] = [];
  for (const row of rows) {
    const [sh, sm] = row.start_time.split(':').map(Number);
    const [eh, em] = row.end_time.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    for (let m = startMins; m + slotMinutes <= endMins; m += slotMinutes) {
      const h    = Math.floor(m / 60);
      const min  = m % 60;
      const eH   = Math.floor((m + slotMinutes) / 60);
      const eMin = (m + slotMinutes) % 60;
      slots.push({
        start_time: `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
        end_time:   `${String(eH).padStart(2,'0')}:${String(eMin).padStart(2,'0')}`,
        available:  true,
        mode:       row.mode || mode,
      });
    }
  }
  return slots;
}

// ─────────────────────────────────────────────────────────────────────────────

const SessionDetailsPage: React.FC<SessionDetailsProps> = ({ expert, user, onBack, onNext }) => {
  const modes = expertModes(expert);

  const [mode, setMode] = useState<'online' | 'inperson'>(() =>
    modes.online ? 'online' : 'inperson'
  );

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots,        setSlots]        = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError,   setSlotsError]   = useState('');
  const [slotsRetry,   setSlotsRetry]   = useState(0); // increment to force retry
  const [slotsOffline,  setSlotsOffline]  = useState(false); // true when showing client-side fallback
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  // ── Set of YYYY-MM-DD dates that the user already has a confirmed appt ──────
  const [bookedDates, setBookedDates]     = useState<Set<string>>(new Set());
  const [bookedDatesLoading, setBookedDatesLoading] = useState(true);

  // ── Error banner: only shown when patient clicks an already-booked date ──────
  const [showBookedError, setShowBookedError] = useState(false);
  const bookedErrorTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the user's existing active appointments with this expert
  useEffect(() => {
    if (!user?.id) { setBookedDatesLoading(false); return; }

    setBookedDatesLoading(true);
    // Bug fix: use getAppointmentsByUser which sends 'status' (singular) — the
    // correct param name — and normalises the response shape automatically.
    appointmentService
      .getAppointmentsByUser(user.id, expert.id, BOOKED_STATUSES)
      .then(appts => {
        const dates = new Set<string>();
        appts.forEach(a => {
          const d = extractDate(a.start_time);
          if (d) dates.add(d);
        });
        setBookedDates(dates);
      })
      .catch(() => {
        // Non-fatal — proceed without blocking the booking flow
        setBookedDates(new Set());
      })
      .finally(() => setBookedDatesLoading(false));
  }, [user?.id, expert.id]);

  const isPast = (y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    const t    = new Date(); t.setHours(0, 0, 0, 0);
    return date < t;
  };

  const isBooked = (dateStr: string) => bookedDates.has(dateStr);

  const cells = buildCalendar(calYear, calMonth);

  // Load slots when date or mode changes — slotsRetry lets the user force a refetch
  const loadSlots = () => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlotsError('');
    setSlotsOffline(false);
    setSelectedSlot(null);

    appointmentService.getAvailableSlots(expert.id, selectedDate)
      .then(res => {
        const raw: any[] = res?.slots ?? [];
        const filtered = raw.filter((s: any) => {
          // BUG FIX: `available` may be omitted by backend — treat undefined as true
          // so valid slots aren't silently discarded.
          if (s.available === false) return false;
          const sm = s.mode;
          if (!sm || sm === 'both') return true;
          return sm === mode;
        });
        setSlots(filtered);
      })
      .catch((err: any) => {
        const status  = err?.response?.status;
        const message = err?.response?.data?.message;

        // ROOT CAUSE FIX: backend /available-slots requires a JWT even for
        // public/guest booking. Fall back to generating slots client-side from
        // the expert's availability schedule so guests can still book.
        if (status === 401 || message?.toLowerCase().includes('token') || message?.toLowerCase().includes('unauthorized')) {
          const fallback = generateSlotsFromAvailability(expert, selectedDate!, mode);
          setSlotsOffline(true);
          setSlots(fallback);
          if (fallback.length === 0) {
            setSlotsError('No availability configured for this date.');
          }
          return;
        }

        setSlotsOffline(false);
        if (!navigator.onLine) {
          setSlotsError('No internet connection. Please check your network and retry.');
        } else if (status === 404) {
          setSlotsError('Slots endpoint not found — please contact support.');
        } else if (status >= 500) {
          setSlotsError('Server error — the backend may be waking up. Please wait a moment and retry.');
        } else if (message) {
          setSlotsError(message);
        } else {
          setSlotsError('Could not load time slots. Please try again.');
        }
      })
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    loadSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, expert.id, mode, slotsRetry]);

  const price      = resolvePrice(expert, mode);
  const canGoNext  = !!(selectedDate && selectedSlot);

  // Show the booked-date error banner for 8 s then auto-hide
  const triggerBookedError = () => {
    setShowBookedError(true);
    if (bookedErrorTimer.current) clearTimeout(bookedErrorTimer.current);
    bookedErrorTimer.current = setTimeout(() => setShowBookedError(false), 8000);
  };

  const handleModeChange = (m: 'online' | 'inperson') => {
    setMode(m);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
  };

  const handleNext = () => {
    if (!selectedDate || !selectedSlot) return;
    onNext({
      mode,
      date:      selectedDate,
      startTime: toISO(selectedSlot.start_time, selectedDate),
      endTime:   toISO(selectedSlot.end_time,   selectedDate),
      price,
      slotLabel: formatSlotLabel(selectedSlot),
    });
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const modeOptions = [
    { id: 'online'   as const, icon: Video,  label: 'Video Call', sub: 'From your home', color: '#60a5fa', glow: 'rgba(59,130,246,',  enabled: modes.online   },
    { id: 'inperson' as const, icon: MapPin, label: 'In-Person',  sub: 'Clinic visit',   color: '#34d399', glow: 'rgba(16,185,129,', enabled: modes.inperson },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)' }}>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur-sm px-4 py-3"
        style={{ background: 'rgba(7,14,26,0.9)', borderBottom: '1px solid var(--border-faint)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Step 2 of 5</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Choose Session Details</p>
          </div>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(s => (
              <div key={s} className="w-2 h-2 rounded-full transition-all"
                style={{ background: s <= 2 ? 'var(--primary)' : 'var(--border-medium)' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Clinician Summary ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold"
            style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', color: '#fff' }}>
            {(expert.full_name || 'Dr').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{expert.full_name}</p>
            {expert.specializations?.[0] && (
              <p className="text-xs" style={{ color: 'var(--primary-light)' }}>{expert.specializations[0]}</p>
            )}
          </div>
          {modes.online && modes.inperson && (
            <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-lg font-medium"
              style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--primary-light)', border: '1px solid var(--border-accent)' }}>
              Online &amp; In-Person
            </span>
          )}
        </div>

        {/* ── Already-booked notice — shown only when patient clicks a booked date ── */}
        {showBookedError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              animation: 'fadeIn 0.25s ease',
            }}>
            <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: '#f87171' }}>
                You already have an active appointment on some dates below.
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                Dates marked with <X className="inline w-3 h-3 mx-0.5" style={{ color: '#f87171' }} /> are unavailable.
                Please choose a different day.
              </p>
            </div>
            <button
              onClick={() => { setShowBookedError(false); if (bookedErrorTimer.current) clearTimeout(bookedErrorTimer.current); }}
              className="flex-shrink-0 p-1 rounded-lg transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Session Mode ──────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Session Mode</h3>

          {modes.online && modes.inperson ? (
            <div className="grid grid-cols-2 gap-3">
              {modeOptions.map(opt => {
                const Icon   = opt.icon;
                const active = mode === opt.id;
                const p      = resolvePrice(expert, opt.id);
                return (
                  <button key={opt.id} onClick={() => handleModeChange(opt.id)}
                    className="relative p-4 rounded-2xl text-left transition-all"
                    style={{
                      background: active ? `${opt.glow}0.12)` : 'var(--bg-surface)',
                      border: `1px solid ${active ? opt.color + '55' : 'var(--border-faint)'}`,
                      boxShadow: active ? `0 0 16px ${opt.glow}0.1)` : 'none',
                    }}>
                    {active && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: opt.color }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Icon className="w-5 h-5 mb-2" style={{ color: active ? opt.color : 'var(--text-muted)' }} />
                    <p className="text-sm font-semibold"
                      style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.sub}</p>
                    {p > 0 && (
                      <p className="flex items-center gap-0.5 text-xs font-medium mt-1.5" style={{ color: opt.color }}>
                        <IndianRupee className="w-3 h-3" />₹{p}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            (() => {
              const opt  = modeOptions.find(o => o.enabled)!;
              const Icon = opt.icon;
              const p    = resolvePrice(expert, opt.id);
              return (
                <div className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: `${opt.glow}0.08)`, border: `1px solid ${opt.color}44` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${opt.glow}0.15)` }}>
                    <Icon className="w-5 h-5" style={{ color: opt.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.sub}</p>
                  </div>
                  {p > 0 && (
                    <p className="flex items-center gap-0.5 text-sm font-bold" style={{ color: opt.color }}>
                      <IndianRupee className="w-3.5 h-3.5" />₹{p}
                    </p>
                  )}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: opt.color }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* ── Calendar ─────────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Pick a Date</h3>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>

            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <button onClick={prevMonth} className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {MONTHS[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-4 pt-3 pb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-medium pb-2"
                  style={{ color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* Skeleton overlay while booked-dates are loading */}
            {bookedDatesLoading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Checking availability…</span>
              </div>
            ) : (
              /* Date cells */
              <div className="grid grid-cols-7 px-4 pb-4 gap-y-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;

                  const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const past    = isPast(calYear, calMonth, day);
                  const booked  = isBooked(dateStr);
                  const dow     = new Date(calYear, calMonth, day).getDay();
                  const avail   = isDayAvailableForMode(expert, dow, mode) && !past && !booked;
                  const selected = selectedDate === dateStr;

                  return (
                    <div key={i} className="relative flex flex-col items-center">
                      <button
                        disabled={past || (!avail && !booked)}
                        title={booked ? 'You already have an appointment on this day' : undefined}
                        onClick={() => {
                          if (booked) { triggerBookedError(); return; }
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className="relative h-9 w-full flex items-center justify-center text-sm rounded-xl transition-all disabled:cursor-not-allowed"
                        style={{
                          background: selected
                            ? 'var(--primary)'
                            : booked
                            ? 'rgba(239,68,68,0.08)'
                            : 'transparent',
                          color: selected
                            ? '#fff'
                            : booked
                            ? '#f87171'
                            : avail
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                          fontWeight: selected ? '600' : '400',
                          opacity: past ? 0.25 : 1,
                          border: booked && !selected
                            ? '1px solid rgba(239,68,68,0.3)'
                            : '1px solid transparent',
                        }}
                        onMouseEnter={e => {
                          if (avail && !selected)
                            (e.currentTarget as HTMLElement).style.background = 'var(--primary-glow)';
                        }}
                        onMouseLeave={e => {
                          if (!selected)
                            (e.currentTarget as HTMLElement).style.background =
                              booked ? 'rgba(239,68,68,0.08)' : 'transparent';
                        }}
                      >
                        {day}

                        {/* Green dot = available */}
                        {avail && !selected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ background: 'var(--primary)' }} />
                        )}

                        {/* Red X = already booked */}
                        {booked && !selected && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: '#ef4444', color: '#fff' }}>
                            <X className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>

                      {/* "Booked" label under cell */}
                      {booked && (
                        <span className="text-[8px] leading-none mt-0.5 font-medium"
                          style={{ color: '#f87171' }}>
                          Booked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 px-5 pb-4 pt-1">
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
                Available
              </span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#ef4444', color: '#fff' }}><X className="w-2.5 h-2.5" /></span>
                Already booked
              </span>
            </div>
          </div>
        </div>

        {/* ── Time Slots ────────────────────────────────────────────── */}
        {selectedDate && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-4 h-4" /> Available Times
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long', month: 'short', day: 'numeric',
                })}
              </span>
            </h3>

            {slotsLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading slots…</span>
              </div>
            ) : slotsError ? (
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div className="flex items-start gap-3 p-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#f87171' }}>Failed to load slots</p>
                    <p className="text-xs mt-0.5" style={{ color: '#fca5a5' }}>{slotsError}</p>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <button
                    onClick={() => setSlotsRetry(r => r + 1)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    ↻ Retry
                  </button>
                </div>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center rounded-2xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No available slots for this date</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Try a different date{modes.online && modes.inperson ? ' or switch the session mode' : ''}.
                </p>
              </div>
            ) : (
              <>
                {/* Soft warning shown when slots are generated client-side (guest/no-auth) */}
                {slotsOffline && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-2"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <span className="text-amber-400 text-xs mt-0.5">⚡</span>
                    <p className="text-xs" style={{ color: '#fbbf24' }}>
                      Showing estimated availability. Actual booked slots will be confirmed after payment.
                    </p>
                  </div>
                )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot, i) => {
                  const label      = formatSlotLabel(slot);
                  const isSelected = selectedSlot?.start_time === slot.start_time;
                  return (
                    <button key={i} onClick={() => setSelectedSlot(slot)}
                      className="py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color:      isSelected ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? 'transparent' : 'var(--border-faint)'}`,
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky bottom CTA ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background: 'rgba(7,14,26,0.95)', borderTop: '1px solid var(--border-faint)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            {selectedSlot && (
              price > 0 ? (
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {mode === 'online' ? 'Online' : 'In-person'} session fee
                  </span>
                  <p className="flex items-center gap-0.5 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    <IndianRupee className="w-4 h-4" />₹{price}
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Free / Pay at clinic</p>
              )
            )}
          </div>
          <button onClick={handleNext} disabled={!canGoNext}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: canGoNext ? 'var(--primary)' : 'var(--bg-elevated)', color: '#fff' }}>
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsPage;