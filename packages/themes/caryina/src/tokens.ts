/**
 * Caryina theme token overrides.
 *
 * Caryina is a handbag accessory brand (HBAG business unit).
 * Strawberry Milk + Light Warm Sage palette with Cormorant Garamond
 * headings and DM Sans body. Pastel palette recedes behind
 * high-prominence product imagery.
 *
 * Only tokens that differ from base are defined here.
 */

import type { Token, TokenMap } from '@themes/base';

export const tokens: TokenMap = {
  // Background: warm ivory
  '--color-bg': { light: '38 18% 98%', dark: '355 14% 10%' },
  // Foreground: warm near-black with pink undertone
  '--color-fg': { light: '355 12% 20%', dark: '355 8% 92%' },
  '--color-fg-muted': { light: '355 8% 52%', dark: '355 6% 55%' },

  // Primary: Strawberry Milk
  '--color-primary': { light: '355 55% 75%', dark: '355 55% 75%' },
  '--color-primary-fg': { light: '355 12% 20%', dark: '355 14% 10%' },
  '--color-primary-soft': { light: '355 40% 96%', dark: '355 30% 22%' },
  '--color-primary-hover': { light: '355 55% 68%', dark: '355 55% 82%' },
  '--color-primary-active': { light: '355 55% 61%', dark: '355 55% 85%' },

  // Accent: Light Warm Sage
  '--color-accent': { light: '130 18% 72%', dark: '130 18% 62%' },
  '--color-accent-fg': { light: '130 20% 18%', dark: '130 15% 88%' },
  '--color-accent-soft': { light: '130 15% 95%', dark: '130 14% 18%' },

  // Borders: warm blush family
  '--color-border': { light: '355 12% 90%', dark: '355 10% 22%' },
  '--color-border-muted': { light: '355 8% 95%', dark: '355 8% 18%' },
  '--color-border-strong': { light: '355 15% 78%', dark: '355 12% 32%' },

  // Surface: warm dark card face (not in base — custom to Caryina)
  '--color-surface': { light: '0 0% 100%', dark: '355 12% 16%' },

  // Typography
  '--font-sans': { light: 'var(--font-dm-sans)' },
  '--font-heading': { light: 'var(--font-cormorant-garamond)' },

  // Shape: restrained radius (brand-dossier: 4px card radius)
  '--radius-sm': { light: '2px' },
  '--radius-md': { light: '4px' },
  '--radius-lg': { light: '8px' },
};

export type { Token, TokenMap };
