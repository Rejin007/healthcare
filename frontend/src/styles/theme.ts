// ── Nila Healthcare — Centralized Theme ──────────────────────────────────────
// ALL color values across the project live here.
// Reference via CSS variables (var(--name)) in component styles.
// Import `colors` / helpers in TypeScript when you need a raw value.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // ── Backgrounds ─────────────────────────────────────────────────────────
  bgDeep:     '#070e1a',
  bgSurface:  '#0c1628',
  bgElevated: '#101f38',
  bgMuted:    '#172840',
  bgHover:    '#1a2f4a',

  // ── Borders ─────────────────────────────────────────────────────────────
  borderFaint:  '#1c2e4a',
  borderMedium: '#243a5e',
  borderStrong: '#2e4a76',
  borderAccent: 'rgba(6,182,212,0.28)',

  // ── Primary — teal/cyan ──────────────────────────────────────────────────
  primary:      '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark:  '#0891b2',
  primaryGlow:  'rgba(6,182,212,0.14)',
  primaryGlow2: 'rgba(6,182,212,0.08)',

  // ── Secondary — violet ───────────────────────────────────────────────────
  secondary:      '#7c3aed',
  secondaryLight: '#8b5cf6',
  secondaryGlow:  'rgba(124,58,237,0.14)',

  // ── Semantic ─────────────────────────────────────────────────────────────
  success:      '#10b981',
  successLight: '#34d399',
  successGlow:  'rgba(16,185,129,0.14)',
  warning:      '#f59e0b',
  warningGlow:  'rgba(245,158,11,0.14)',
  danger:       '#ef4444',
  dangerGlow:   'rgba(239,68,68,0.14)',
  info:         '#3b82f6',
  infoGlow:     'rgba(59,130,246,0.14)',

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#f0f6ff',
  textSecondary: '#8fa8c8',
  textMuted:     '#4a6080',
  textAccent:    '#22d3ee',

  // ── Mode badge tokens ────────────────────────────────────────────────────
  online:   { bg:'rgba(59,130,246,0.10)',  text:'#60a5fa', border:'rgba(59,130,246,0.28)'  },
  inperson: { bg:'rgba(16,185,129,0.10)', text:'#34d399', border:'rgba(16,185,129,0.28)' },

  // ── Status tokens ────────────────────────────────────────────────────────
  status: {
    scheduled:     { bg:'rgba(59,130,246,0.10)',  text:'#60a5fa', border:'rgba(59,130,246,0.25)',  dot:'#3b82f6'  },
    confirmed:     { bg:'rgba(16,185,129,0.10)', text:'#34d399', border:'rgba(16,185,129,0.25)', dot:'#10b981' },
    'in-progress': { bg:'rgba(245,158,11,0.10)', text:'#fbbf24', border:'rgba(245,158,11,0.25)', dot:'#f59e0b' },
    completed:     { bg:'rgba(139,92,246,0.10)', text:'#a78bfa', border:'rgba(139,92,246,0.25)', dot:'#8b5cf6' },
    cancelled:     { bg:'rgba(239,68,68,0.10)',  text:'#f87171', border:'rgba(239,68,68,0.25)',  dot:'#ef4444' },
    'no-show':     { bg:'rgba(100,116,139,0.10)',text:'#94a3b8', border:'rgba(100,116,139,0.25)',dot:'#64748b' },
  },

  // ── Avatar gradients (by name hash) ─────────────────────────────────────
  avatarGrads: [
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#7c3aed,#ec4899)',
    'linear-gradient(135deg,#10b981,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#8b5cf6,#3b82f6)',
  ],
} as const;

export const avatarGrad = (name: string) =>
  colors.avatarGrads[name.charCodeAt(0) % colors.avatarGrads.length];

export const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
