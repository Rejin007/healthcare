import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Video, MapPin, ChevronRight, RefreshCw,
  X, IndianRupee, Award, SlidersHorizontal, ArrowLeft,
  CheckCircle, Star, Clock, Filter
} from 'lucide-react';
import { expertService } from '../../services/expert.service';
import { Expert } from '../../types';

interface CliniciansListProps {
  onSelectClinician: (expert: Expert) => void;
  onBack?: () => void;
}

const SPEC_FILTERS = ['All','Psychologist','Therapist','Psychiatrist','Counselor','Child Psychologist','Relationship Therapist'];
const MODE_FILTERS = [{ id: 'all', label: 'Any Mode' }, { id: 'online', label: 'Online Only' }, { id: 'inperson', label: 'In-Person Only' }];
const DAY_LABELS   = ['S','M','T','W','T','F','S'];
const GRADS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

const CliniciansListPage: React.FC<CliniciansListProps> = ({ onSelectClinician, onBack }) => {
  const [experts,          setExperts]          = useState<Expert[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [debouncedSearch,  setDebouncedSearch]  = useState('');
  const [page,             setPage]             = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [totalItems,       setTotalItems]       = useState(0);
  const [specFilter,       setSpecFilter]       = useState('All');
  const [modeFilter,       setModeFilter]       = useState('all');
  const [showFilters,      setShowFilters]       = useState(false);
  const [selectedId,       setSelectedId]       = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, specFilter, modeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await expertService.getAll(page, 12, specFilter !== 'All' ? '' : debouncedSearch);
      let data: Expert[] = res.data?.experts || [];

      // Client-side specialization filter
      if (specFilter !== 'All') {
        data = data.filter((e: Expert) =>
          e.specializations?.some(s => s.toLowerCase().includes(specFilter.toLowerCase()))
        );
      }
      // Client-side search if spec filter is active
      if (specFilter !== 'All' && debouncedSearch) {
        data = data.filter((e: Expert) =>
          (e.full_name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      // Client-side mode filter
      if (modeFilter !== 'all') {
        data = data.filter((e: Expert) => {
          if (modeFilter === 'online')   return !!(e.online_price   || e.availability?.some(a => !a.mode || a.mode === 'online'));
          if (modeFilter === 'inperson') return !!(e.inperson_price || e.availability?.some(a => a.mode === 'inperson'));
          return true;
        });
      }

      setExperts(data);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalItems(res.data?.pagination?.totalItems || data.length);
    } catch { setExperts([]); }
    finally   { setLoading(false); }
  }, [page, debouncedSearch, specFilter, modeFilter]);

  useEffect(() => { load(); }, [load]);

  const hasOnline   = (e: Expert) => !!(e.online_price   || e.availability?.some(a => !a.mode || a.mode === 'online'));
  const hasInPerson = (e: Expert) => !!(e.inperson_price || e.availability?.some(a => a.mode === 'inperson'));
  const minPrice    = (e: Expert) => {
    const prices = [e.online_price, e.inperson_price, ...(e.pricing?.map(p => p.price) || [])].filter(Boolean) as number[];
    return prices.length ? Math.min(...prices) : null;
  };
  const availDays   = (e: Expert) => [...new Set(e.availability?.map(a => a.day_of_week) || [])].sort();
  const initials    = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const activeFilters = [specFilter !== 'All' && specFilter, modeFilter !== 'all' && (modeFilter === 'online' ? 'Online' : 'In-Person'), debouncedSearch && `"${debouncedSearch}"`].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#07111e', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sticky header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30"
        style={{ background: 'rgba(7,17,30,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
          {onBack && (
            <button onClick={onBack}
              className="p-2 rounded-xl flex-shrink-0 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#94a3b8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#64748b'}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#334155' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search therapists, specializations..."
              className="w-full pl-11 pr-10 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
              onFocus={e => e.target.style.borderColor='rgba(6,182,212,0.5)'}
              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: '#334155' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all relative"
            style={{
              background: showFilters ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
              border:     `1px solid ${showFilters ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color:      showFilters ? '#22d3ee' : '#64748b',
            }}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                style={{ background: '#06b6d4' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-4 sm:px-6 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Specialization */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 mt-3" style={{ color: '#334155' }}>Specialization</p>
              <div className="flex gap-2 flex-wrap">
                {SPEC_FILTERS.map(f => (
                  <button key={f} onClick={() => setSpecFilter(f)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: specFilter === f ? '#06b6d4' : 'rgba(255,255,255,0.04)',
                      color:      specFilter === f ? '#fff' : '#475569',
                      border:     `1px solid ${specFilter === f ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Session mode */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#334155' }}>Session Type</p>
              <div className="flex gap-2">
                {MODE_FILTERS.map(m => (
                  <button key={m.id} onClick={() => setModeFilter(m.id)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: modeFilter === m.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                      color:      modeFilter === m.id ? '#22d3ee' : '#475569',
                      border:     `1px solid ${modeFilter === m.id ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: '#334155' }}>Active:</span>
                {activeFilters.map((f, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
                    {f}
                  </span>
                ))}
                <button onClick={() => { setSpecFilter('All'); setModeFilter('all'); setSearch(''); }}
                  className="text-[11px] ml-1 transition-colors" style={{ color: '#ef4444' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.7'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results count + progress */}
        {!loading && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(7,14,26,0.5)' }}>
            <p className="text-xs font-medium" style={{ color: '#334155' }}>
              {totalItems} expert{totalItems !== 1 ? 's' : ''} available
            </p>
            <button onClick={load}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ color: '#1e3050' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#475569'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#1e3050'}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-10 h-10 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(6,182,212,0.1)', borderTopColor: '#06b6d4' }} />
            <p className="text-sm font-medium" style={{ color: '#1e3050' }}>Finding therapists…</p>
          </div>
        ) : experts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Search className="w-8 h-8 opacity-15" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold mb-1" style={{ color: '#334155' }}>No therapists found</p>
              <p className="text-sm" style={{ color: '#1e3050' }}>Try adjusting your filters</p>
            </div>
            <button onClick={() => { setSpecFilter('All'); setModeFilter('all'); setSearch(''); }}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experts.map(expert => {
              const name    = expert.full_name || 'Therapist';
              const days    = availDays(expert);
              const online  = hasOnline(expert);
              const inp     = hasInPerson(expert);
              const price   = minPrice(expert);
              const init    = initials(name);
              const grad    = GRADS[name.charCodeAt(0) % GRADS.length];
              const isSelected = selectedId === expert.id;

              return (
                <div key={expert.id}
                  onClick={() => { setSelectedId(expert.id); onSelectClinician(expert); }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col group"
                  style={{
                    background: 'rgba(10,18,32,0.92)',
                    border: `1px solid ${isSelected ? 'rgba(6,182,212,0.6)' : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isSelected ? '0 0 0 3px rgba(6,182,212,0.15), 0 16px 40px rgba(0,0,0,0.3)' : 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.35)';
                    (e.currentTarget as HTMLElement).style.transform   = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow   = '0 12px 36px rgba(0,0,0,0.35)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = isSelected ? 'rgba(6,182,212,0.6)' : 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.transform   = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow   = isSelected ? '0 0 0 3px rgba(6,182,212,0.15)' : 'none';
                  }}>

                  {/* Gradient accent line */}
                  <div className={`h-0.5 bg-gradient-to-r ${grad} opacity-40 group-hover:opacity-80 transition-opacity`} />

                  <div className="p-5 flex-1 flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative flex-shrink-0">
                        {expert.profile_image
                          ? <img src={expert.profile_image} alt={name}
                              className="w-14 h-14 rounded-2xl object-cover" />
                          : <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-base font-bold text-white`}>
                              {init}
                            </div>
                        }
                        {expert.is_active !== false && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                            style={{ background: '#10b981', borderColor: 'rgba(10,18,32,0.92)' }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold leading-tight truncate" style={{ color: '#f1f5f9' }}>{name}</h3>
                          {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22d3ee' }} />}
                        </div>
                        {expert.specializations && expert.specializations.length > 0 && (
                          <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: '#22d3ee' }}>
                            {expert.specializations.slice(0, 2).join(' · ')}
                          </p>
                        )}
                        {expert.experience_years && (
                          <div className="flex items-center gap-1 mt-1">
                            <Award className="w-3 h-3" style={{ color: '#334155' }} />
                            <span className="text-[11px]" style={{ color: '#475569' }}>{expert.experience_years}+ yrs exp</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {expert.bio && (
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#475569' }}>
                        {expert.bio}
                      </p>
                    )}

                    {/* Availability days */}
                    {days.length > 0 && (
                      <div className="flex gap-1">
                        {DAY_LABELS.map((d, i) => {
                          const active = days.includes(i);
                          return (
                            <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                              style={{
                                background: active ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.025)',
                                color:      active ? '#22d3ee' : '#1a2744',
                                border:     `1px solid ${active ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.04)'}`,
                              }}>
                              {d}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Mode badges */}
                    <div className="flex gap-2 flex-wrap">
                      {online && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
                          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                          <Video className="w-3 h-3" />
                          Online{expert.online_price ? ` · ₹${expert.online_price}` : ''}
                        </span>
                      )}
                      {inp && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl"
                          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                          <MapPin className="w-3 h-3" />
                          In-Person{expert.inperson_price ? ` · ₹${expert.inperson_price}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3.5 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,14,26,0.5)' }}>
                    <div>
                      {price != null ? (
                        <>
                          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#1e3050' }}>From</p>
                          <div className="flex items-center gap-0.5">
                            <span className="text-base font-bold" style={{ color: '#f1f5f9' }}>₹{price}</span>
                            <span className="text-[10px] ml-1" style={{ color: '#334155' }}>/session</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: '#334155' }}>Contact for price</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 14px rgba(6,182,212,0.25)' }}>
                      Select <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-3 mt-8 pb-4">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              ← Previous
            </button>
            <span className="text-sm font-medium px-3" style={{ color: '#334155' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CliniciansListPage;
