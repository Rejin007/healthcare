import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Video, MapPin, ChevronRight, RefreshCw,
  X, Award, SlidersHorizontal, ArrowLeft,
  CheckCircle, Clock, Star, IndianRupee
} from 'lucide-react';
import { expertService } from '../../services/expert.service';
import { Expert } from '../../types';
import { avatarGrad, initials } from '../../styles/theme';

interface Props {
  onSelectClinician: (expert: Expert) => void;
  onBack?: () => void;
}

const SPECS = ['All','Psychologist','Therapist','Psychiatrist','Counselor','Child Psychologist','Relationship Therapist'];
const MODES = [
  { id: 'all',      label: 'All Sessions' },
  { id: 'online',   label: 'Online' },
  { id: 'inperson', label: 'In-Person' },
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const hasOnline   = (e: Expert) => !!(e.online_price || e.availability?.some(a => !a.mode || a.mode === 'online' || a.mode === 'both'));
const hasInPerson = (e: Expert) => !!(e.inperson_price || e.availability?.some(a => a.mode === 'inperson' || a.mode === 'both'));
const minPrice    = (e: Expert) => {
  const prices = [e.online_price, e.inperson_price, ...(e.pricing?.map(p => p.price) ?? [])].filter(Boolean) as number[];
  return prices.length ? Math.min(...prices) : null;
};
const availDays   = (e: Expert) => [...new Set(e.availability?.map(a => a.day_of_week) ?? [])].sort();

/* ── Skeleton Card ─────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-2xl p-5 flex gap-4" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>
    <div className="w-16 h-16 rounded-2xl flex-shrink-0 skeleton" />
    <div className="flex-1 space-y-3">
      <div className="h-4 w-40 rounded-lg skeleton" />
      <div className="h-3 w-28 rounded-lg skeleton" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full skeleton" />
        <div className="h-6 w-20 rounded-full skeleton" />
      </div>
    </div>
  </div>
);

/* ── Expert Card ───────────────────────────────────────────────────────────── */
const ExpertCard: React.FC<{ expert: Expert; selected: boolean; onSelect: () => void }> = ({ expert, selected, onSelect }) => {
  const name    = expert.full_name || 'Therapist';
  const grad    = avatarGrad(name);
  const init    = initials(name);
  const days    = availDays(expert);
  const online  = hasOnline(expert);
  const inp     = hasInPerson(expert);
  const price   = minPrice(expert);

  return (
    <div
      onClick={onSelect}
      className="card-lift cursor-pointer rounded-2xl overflow-hidden group"
      style={{
        background:   selected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border:       `1px solid ${selected ? 'var(--border-accent)' : 'var(--border-faint)'}`,
        boxShadow:    selected ? '0 0 0 3px var(--primary-glow), 0 8px 32px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {/* Accent line */}
      <div className="h-0.5 transition-opacity duration-200"
        style={{ background: grad, opacity: selected ? 1 : 0.3 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = selected ? '1' : '0.3'} />

      <div className="p-5">
        {/* ── Top row: avatar + name + badge ─────────────────────── */}
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {expert.profile_image
              ? <img src={expert.profile_image} alt={name}
                  className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                  style={{ background: grad }}>
                  {init}
                </div>
            }
            {expert.is_active !== false && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{ background:'var(--success)', borderColor:'var(--bg-surface)' }} />
            )}
          </div>

          {/* Name / specs / exp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold leading-tight" style={{ color:'var(--text-primary)' }}>
                  {name}
                </h3>
                {expert.specializations && expert.specializations.length > 0 && (
                  <p className="text-xs font-semibold mt-0.5 line-clamp-1" style={{ color:'var(--text-accent)' }}>
                    {expert.specializations.slice(0,2).join(' · ')}
                  </p>
                )}
              </div>
              {selected && (
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color:'var(--primary)' }} />
              )}
            </div>

            {expert.experience_years && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Award className="w-3 h-3" style={{ color:'var(--text-muted)' }} />
                <span className="text-[11px] font-medium" style={{ color:'var(--text-muted)' }}>
                  {expert.experience_years}+ yrs experience
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Bio ────────────────────────────────────────────────── */}
        {expert.bio && (
          <p className="text-xs leading-relaxed mt-3 line-clamp-2" style={{ color:'var(--text-muted)' }}>
            {expert.bio}
          </p>
        )}

        {/* ── Availability days ───────────────────────────────────── */}
        {days.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color:'var(--text-muted)' }} />
            <div className="flex gap-1">
              {DAY_LABELS.map((d, i) => {
                const active = days.includes(i);
                return (
                  <span key={i} className="w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center"
                    style={{
                      background: active ? 'var(--primary-glow)' : 'transparent',
                      color:      active ? 'var(--primary-light)' : 'var(--border-medium)',
                      border:     `1px solid ${active ? 'var(--border-accent)' : 'var(--border-faint)'}`,
                    }}>
                    {d}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Mode badges ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mt-3">
          {online && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
              style={{ background:'rgba(59,130,246,0.10)', border:'1px solid rgba(59,130,246,0.22)', color:'#60a5fa' }}>
              <Video className="w-3 h-3" />
              Online{expert.online_price ? ` · ₹${expert.online_price}` : ''}
            </span>
          )}
          {inp && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
              style={{ background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.22)', color:'#34d399' }}>
              <MapPin className="w-3 h-3" />
              In-Person{expert.inperson_price ? ` · ₹${expert.inperson_price}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderTop:'1px solid var(--border-faint)', background:'rgba(0,0,0,0.15)' }}>
        <div>
          {price != null ? (
            <>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Starting from</p>
              <p className="text-base font-bold flex items-center gap-0.5" style={{ color:'var(--text-primary)' }}>
                ₹{price}
                <span className="text-[11px] font-normal ml-0.5" style={{ color:'var(--text-muted)' }}>/session</span>
              </p>
            </>
          ) : (
            <span className="text-xs" style={{ color:'var(--text-muted)' }}>Contact for pricing</span>
          )}
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all"
          style={{ background:'linear-gradient(135deg, var(--primary), var(--info))', boxShadow:'0 4px 14px var(--primary-glow)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(6,182,212,0.35)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px var(--primary-glow)'}>
          Book Now <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ── Main Page ─────────────────────────────────────────────────────────────── */
const CliniciansListPage: React.FC<Props> = ({ onSelectClinician, onBack }) => {
  const [experts,         setExperts]         = useState<Expert[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [totalItems,      setTotalItems]      = useState(0);
  const [specFilter,      setSpecFilter]      = useState('All');
  const [modeFilter,      setModeFilter]      = useState('all');
  const [showFilters,     setShowFilters]     = useState(false);
  const [selectedId,      setSelectedId]      = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, specFilter, modeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const searchQ = specFilter === 'All' ? debouncedSearch : '';
      const res = await expertService.getAll(page, 12, searchQ);
      let data: Expert[] = res.data?.experts ?? [];

      if (specFilter !== 'All')
        data = data.filter(e => e.specializations?.some(s => s.toLowerCase().includes(specFilter.toLowerCase())));
      if (specFilter !== 'All' && debouncedSearch)
        data = data.filter(e => (e.full_name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()));
      if (modeFilter === 'online')   data = data.filter(hasOnline);
      if (modeFilter === 'inperson') data = data.filter(hasInPerson);

      setExperts(data);
      setTotalPages(res.data?.pagination?.totalPages ?? 1);
      setTotalItems(res.data?.pagination?.totalItems ?? data.length);
    } catch { setExperts([]); }
    finally  { setLoading(false); }
  }, [page, debouncedSearch, specFilter, modeFilter]);

  useEffect(() => { load(); }, [load]);

  const activeFilters = [
    specFilter !== 'All'     && specFilter,
    modeFilter !== 'all'     && (modeFilter === 'online' ? 'Online' : 'In-Person'),
    debouncedSearch          && `"${debouncedSearch}"`,
  ].filter(Boolean);

  const clearAll = () => { setSpecFilter('All'); setModeFilter('all'); setSearch(''); };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor:'var(--bg-deep)', color:'var(--text-primary)' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30"
        style={{ background:'rgba(7,14,26,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border-faint)', boxShadow:'0 4px 24px rgba(0,0,0,0.25)' }}>

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 max-w-5xl mx-auto w-full">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-xl flex-shrink-0 transition-colors"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search therapists, specializations..."
              className="w-full pl-11 pr-10 py-2.5 rounded-xl text-sm transition-all"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-primary)' }}
              onFocus={e  => e.target.style.borderColor = 'var(--border-accent)'}
              onBlur={e   => e.target.style.borderColor = 'var(--border-faint)'} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                style={{ color:'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(f => !f)}
            className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
            style={{
              background: showFilters ? 'var(--primary-glow)' : 'var(--bg-surface)',
              border:     `1px solid ${showFilters ? 'var(--border-accent)' : 'var(--border-faint)'}`,
              color:      showFilters ? 'var(--primary-light)' : 'var(--text-muted)',
            }}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                style={{ background:'var(--primary)' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-4 sm:px-6 pb-4 max-w-5xl mx-auto w-full" style={{ borderTop:'1px solid var(--border-faint)' }}>
            {/* Specialization */}
            <p className="text-[10px] font-bold uppercase tracking-widest mt-3 mb-2" style={{ color:'var(--text-muted)' }}>Specialization</p>
            <div className="flex gap-2 flex-wrap">
              {SPECS.map(f => (
                <button key={f} onClick={() => setSpecFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: specFilter === f ? 'var(--primary)' : 'var(--bg-elevated)',
                    color:      specFilter === f ? '#fff' : 'var(--text-muted)',
                    border:     `1px solid ${specFilter === f ? 'transparent' : 'var(--border-faint)'}`,
                  }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Session type */}
            <p className="text-[10px] font-bold uppercase tracking-widest mt-4 mb-2" style={{ color:'var(--text-muted)' }}>Session Type</p>
            <div className="flex gap-2">
              {MODES.map(m => (
                <button key={m.id} onClick={() => setModeFilter(m.id)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: modeFilter === m.id ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                    color:      modeFilter === m.id ? 'var(--primary-light)' : 'var(--text-muted)',
                    border:     `1px solid ${modeFilter === m.id ? 'var(--border-accent)' : 'var(--border-faint)'}`,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[11px]" style={{ color:'var(--text-muted)' }}>Active:</span>
                {activeFilters.map((f, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background:'var(--primary-glow)', color:'var(--primary-light)', border:'1px solid var(--border-accent)' }}>
                    {f}
                  </span>
                ))}
                <button onClick={clearAll} className="text-[11px] ml-1 transition-opacity hover:opacity-70"
                  style={{ color:'var(--danger)' }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Count bar */}
        {!loading && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 max-w-5xl mx-auto w-full"
            style={{ borderTop:'1px solid var(--border-faint)', background:'rgba(0,0,0,0.2)' }}>
            <p className="text-xs font-medium" style={{ color:'var(--text-muted)' }}>
              {totalItems} therapist{totalItems !== 1 ? 's' : ''} available
            </p>
            <button onClick={load}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ color:'var(--border-strong)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--border-strong)'}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : experts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)' }}>
              <Search className="w-8 h-8 opacity-20" />
            </div>
            <div>
              <p className="text-base font-bold mb-1" style={{ color:'var(--text-secondary)' }}>No therapists found</p>
              <p className="text-sm" style={{ color:'var(--text-muted)' }}>Try adjusting your filters or search</p>
            </div>
            <button onClick={clearAll}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background:'var(--primary-glow)', border:'1px solid var(--border-accent)', color:'var(--primary-light)' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {experts.map(expert => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                selected={selectedId === expert.id}
                onSelect={() => { setSelectedId(expert.id); onSelectClinician(expert); }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-3 mt-8 pb-4">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-secondary)' }}>
              ← Previous
            </button>
            <span className="text-sm font-medium px-3" style={{ color:'var(--text-muted)' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border-faint)', color:'var(--text-secondary)' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CliniciansListPage;