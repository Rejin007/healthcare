// ── Nila Healthcare — Centralized Theme ──────────────────────────────────────
// All colors used across the patient booking UI live here.
// Import this file instead of writing inline color values.

export const colors = {
  // Background shades
  bgDeep:     '#070e1a',  // deepest background
  bgSurface:  '#0d1829',  // card surfaces
  bgElevated: '#112038',  // elevated panels
  bgMuted:    '#1a2d47',  // subtle backgrounds

  // Borders
  borderFaint:  '#1e3050',
  borderMedium: '#253d62',
  borderAccent: 'rgba(6,182,212,0.25)',

  // Primary accent — teal/cyan
  primary:      '#06b6d4',  // cyan-500
  primaryLight: '#22d3ee',  // cyan-400
  primaryDark:  '#0891b2',  // cyan-600
  primaryGlow:  'rgba(6,182,212,0.15)',

  // Secondary accent — violet
  secondary:      '#7c3aed',
  secondaryLight: '#8b5cf6',
  secondaryGlow:  'rgba(124,58,237,0.15)',

  // Semantic
  success:      '#10b981',
  successGlow:  'rgba(16,185,129,0.15)',
  warning:      '#f59e0b',
  warningGlow:  'rgba(245,158,11,0.15)',
  danger:       '#ef4444',
  dangerGlow:   'rgba(239,68,68,0.15)',
  info:         '#3b82f6',
  infoGlow:     'rgba(59,130,246,0.15)',

  // Text
  textPrimary:   '#f1f5f9',  // almost white
  textSecondary: '#94a3b8',  // slate-400
  textMuted:     '#475569',  // slate-600
  textAccent:    '#06b6d4',

  // Mode badges
  online:      { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  inperson:    { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
} as const;

// CSS custom properties string — inject once in index.css
export const cssVars = `
  :root {
    --bg-deep: ${colors.bgDeep};
    --bg-surface: ${colors.bgSurface};
    --bg-elevated: ${colors.bgElevated};
    --bg-muted: ${colors.bgMuted};
    --border-faint: ${colors.borderFaint};
    --border-medium: ${colors.borderMedium};
    --border-accent: ${colors.borderAccent};
    --primary: ${colors.primary};
    --primary-light: ${colors.primaryLight};
    --primary-dark: ${colors.primaryDark};
    --primary-glow: ${colors.primaryGlow};
    --secondary: ${colors.secondary};
    --secondary-light: ${colors.secondaryLight};
    --secondary-glow: ${colors.secondaryGlow};
    --success: ${colors.success};
    --success-glow: ${colors.successGlow};
    --warning: ${colors.warning};
    --warning-glow: ${colors.warningGlow};
    --danger: ${colors.danger};
    --danger-glow: ${colors.dangerGlow};
    --text-primary: ${colors.textPrimary};
    --text-secondary: ${colors.textSecondary};
    --text-muted: ${colors.textMuted};
    --text-accent: ${colors.textAccent};
  }
`;
