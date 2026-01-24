/**
 * Prime theme token overrides.
 *
 * Prime is a guest-facing hospitality portal (Positano, Italy).
 * These overrides layer on top of @themes/base to give the app
 * a warm, Mediterranean feel while remaining minimal.
 *
 * Only tokens that differ from base are defined here.
 */

import type { Token, TokenMap } from '@themes/base';

export const tokens: TokenMap = {
  // Brand: warm teal primary (Mediterranean)
  '--color-primary': { light: '192 80% 34%', dark: '192 75% 55%' },
  '--color-primary-fg': { light: '0 0% 100%', dark: '0 0% 10%' },
  '--color-primary-soft': { light: '192 70% 95%', dark: '192 70% 18%' },
  '--color-primary-hover': { light: '192 80% 30%', dark: '192 75% 62%' },
  '--color-primary-active': { light: '192 80% 26%', dark: '192 75% 68%' },

  // Accent: warm amber (sunset)
  '--color-accent': { light: '32 90% 55%', dark: '32 85% 60%' },
  '--color-accent-fg': { light: '0 0% 10%', dark: '0 0% 10%' },
  '--color-accent-soft': { light: '32 90% 95%', dark: '32 70% 20%' },

  // Typography: prime uses the shared Geist Sans token
  '--font-sans': {
    light: 'var(--font-geist-sans)',
  },

  // Slightly softer corners for a friendlier feel
  '--radius-md': { light: '0.5rem' },
  '--radius-lg': { light: '0.75rem' },
};

export type { Token, TokenMap };
