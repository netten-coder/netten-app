/**
 * NETTEN DESIGN TOKENS
 * ─────────────────────────────────────────────────────────────
 * This is the single source of truth for NETTEN's visual identity.
 * A UI/UX designer can modify this file to restyle the entire
 * dashboard without touching any component logic.
 *
 * After changes: run `npm run dev` to preview locally.
 */

export const theme = {
  // ── Brand Colors ──────────────────────────────────────────────
  colors: {
    // Primary brand greens — change these to rebrand entirely
    brandDark:    '#041E17',   // page background
    brand:        '#1D9E75',   // primary buttons, accents
    brandLight:   '#25C28F',   // hover states, highlights
    brandMuted:   '#E6F7F1',   // subtle backgrounds

    // Surface colors — dashboard panels and cards
    surface:      '#0D2B22',   // sidebar, main surfaces
    surfaceCard:  '#112D24',   // cards, elevated panels
    surfaceHover: '#163830',   // hover state for list items
    surfaceBorder:'#1F4035',   // borders, dividers

    // Text colors
    textPrimary:  '#F1FAF6',   // headings, main content
    textMuted:    '#9CA3AF',   // secondary text, labels
    textFaint:    '#6B7280',   // placeholder, disabled

    // Status colors
    success:      '#1D9E75',   // completed, verified
    warning:      '#F59E0B',   // pending, caution
    error:        '#EF4444',   // failed, destructive
    info:         '#3B82F6',   // informational
  },

  // ── Typography ────────────────────────────────────────────────
  fonts: {
    sans:  "'Inter', system-ui, sans-serif",    // body text, UI
    mono:  "'JetBrains Mono', Menlo, monospace", // code, addresses, amounts
    // To change the font: update here + tailwind.config.ts fontFamily
  },

  // ── Spacing & Layout ──────────────────────────────────────────
  layout: {
    sidebarWidth:   '240px',  // dashboard sidebar width
    contentPadding: '24px',   // main content area padding
    cardRadius:     '16px',   // border radius for cards
    buttonRadius:   '12px',   // border radius for buttons
    inputRadius:    '12px',   // border radius for inputs
  },

  // ── Component Defaults ────────────────────────────────────────
  components: {
    // Button styles — maps to Tailwind classes in globals.css
    button: {
      primary:   'bg-brand text-white hover:bg-brand-light',
      secondary: 'bg-surface-card text-gray-300 border border-surface-border hover:border-brand/50',
      danger:    'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
    },

    // Badge colors per status
    badge: {
      green:  'bg-brand/20 text-brand-light',
      yellow: 'bg-yellow-500/20 text-yellow-400',
      red:    'bg-red-500/20 text-red-400',
      gray:   'bg-gray-500/20 text-gray-400',
      blue:   'bg-blue-500/20 text-blue-400',
    },

    // Plan badge colors — customize per tier
    plans: {
      STARTER:      'bg-brand/20 text-brand-light',
      PRO:          'bg-purple-500/20 text-purple-400',
      BUSINESS:     'bg-blue-500/20 text-blue-400',
      ENTERPRISE:   'bg-yellow-500/20 text-yellow-400',
      FOUNDER_FREE: 'bg-brand/30 text-brand-light border border-brand/40',
    },
  },

  // ── Animation ─────────────────────────────────────────────────
  animation: {
    // Tailwind transition durations used across components
    fast:   '100ms',
    normal: '150ms',
    slow:   '300ms',
  },
} as const

export type ThemeColors = typeof theme.colors
export type ThemePlan = keyof typeof theme.components.plans
