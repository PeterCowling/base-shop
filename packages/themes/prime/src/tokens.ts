/**
 * Prime theme token overrides.
 *
 * Prime is a guest-facing hospitality portal (Positano, Italy).
 * Target demographic: 99% female, 60% aged 18-25, mobile-only.
 * Warm coral/rose palette with Plus Jakarta Sans for a friendly,
 * lifestyle-app aesthetic.
 *
 * Only tokens that differ from base are defined here.
 */

import type { Token, TokenMap } from '@themes/base';

export const tokens: TokenMap = {
  // Brand: warm coral primary (lifestyle/travel)
  '--color-primary': { light: '6 78% 47%', dark: '6 72% 68%' },
  '--color-primary-fg': { light: '0 0% 100%', dark: '0 0% 10%' },
  '--color-primary-soft': { light: '6 65% 96%', dark: '6 60% 18%' },
  '--color-primary-hover': { light: '6 78% 42%', dark: '6 72% 74%' },
  '--color-primary-active': { light: '6 78% 37%', dark: '6 72% 78%' },

  // Accent: warm gold (complementary to coral)
  '--color-accent': { light: '36 85% 55%', dark: '36 80% 62%' },
  '--color-accent-fg': { light: '0 0% 10%', dark: '0 0% 10%' },
  '--color-accent-soft': { light: '36 80% 96%', dark: '36 65% 20%' },

  // Typography: Plus Jakarta Sans for friendly, mobile-optimized feel
  '--font-sans': {
    light: 'var(--font-plus-jakarta-sans)',
  },

  // Slightly softer corners for a friendlier feel
  '--radius-md': { light: '0.5rem' },
  '--radius-lg': { light: '0.75rem' },
};

export type { Token, TokenMap };
