/**
 * Reception theme token overrides.
 *
 * Reception is a dark-first hospitality POS interface used in hostel
 * environments. Green-on-black terminal aesthetic with high-contrast
 * status signals for operational awareness.
 *
 * Only tokens that differ from base are defined here.
 */

import type { Token, TokenMap } from '@themes/base';

export const tokens: TokenMap = {
  // Brand: hospitality green primary (operational readiness signal)
  '--color-primary': { light: '142 72% 30%', dark: '142 70% 48%' },
  '--color-primary-fg': { light: '0 0% 100%', dark: '160 8% 4%' },
  '--color-primary-soft': { light: '142 60% 95%', dark: '142 50% 14%' },
  '--color-primary-hover': { light: '142 72% 25%', dark: '142 70% 54%' },
  '--color-primary-active': { light: '142 72% 20%', dark: '142 70% 58%' },

  // Accent: warm amber/orange (hospitality warning signal)
  '--color-accent': { light: '36 90% 50%', dark: '36 85% 58%' },
  '--color-accent-fg': { light: '0 0% 10%', dark: '0 0% 10%' },
  '--color-accent-soft': { light: '36 80% 95%', dark: '36 60% 16%' },

  // Surfaces: slightly warm-tinted for hospitality feel
  '--surface-1': { light: '0 0% 100%', dark: '160 8% 4%' },
  '--surface-2': { light: '150 4% 96%', dark: '160 8% 8%' },
  '--surface-3': { light: '150 4% 92%', dark: '160 6% 12%' },
  '--surface-input': { light: '150 4% 97%', dark: '160 6% 10%' },

  // Background with slight green tint in dark mode
  '--color-bg': { light: '0 0% 100%', dark: '160 8% 4%' },
  '--color-fg': { light: '0 0% 10%', dark: '150 10% 92%' },
  '--color-fg-muted': { light: '0 0% 40%', dark: '150 5% 65%' },

  // Panel and inset surfaces
  '--color-panel': { light: '150 4% 97%', dark: '160 6% 10%' },
  '--color-inset': { light: '150 4% 98%', dark: '160 8% 6%' },

  // Borders: subtle green tint in dark mode
  '--color-border': { light: '0 0% 80%', dark: '150 6% 22%' },
  '--color-border-strong': { light: '0 0% 65%', dark: '150 6% 35%' },
  '--color-border-muted': { light: '0 0% 88%', dark: '150 5% 16%' },

  // Focus ring: matches primary green
  '--color-focus-ring': { light: '142 72% 30%', dark: '142 70% 48%' },
  '--ring': { light: '142 72% 30%', dark: '142 70% 48%' },

  // Link color: green-tinted
  '--color-link': { light: '142 60% 28%', dark: '142 65% 60%' },

  // Muted: green-tinted neutral
  '--color-muted': { light: '150 4% 88%', dark: '150 5% 24%' },
  '--color-muted-fg': { light: '0 0% 20%', dark: '150 5% 85%' },

  // Typography: Inter for UI, JetBrains Mono for data/code
  '--font-sans': { light: 'var(--font-inter)' },
  '--font-mono': { light: 'var(--font-jetbrains-mono)' },

  // ── Category shade families (bar/POS product grid) ──────────────────
  // Pink shades (Sweet, Gelato)
  '--color-pinkShades-row1': { light: '330 55% 88%', dark: '330 25% 22%' },
  '--color-pinkShades-row2': { light: '330 55% 82%', dark: '330 25% 26%' },
  '--color-pinkShades-row3': { light: '330 50% 76%', dark: '330 22% 30%' },
  '--color-pinkShades-row4': { light: '330 45% 70%', dark: '330 20% 34%' },

  // Coffee shades
  '--color-coffeeShades-row1': { light: '25 40% 82%', dark: '25 22% 22%' },
  '--color-coffeeShades-row2': { light: '25 40% 74%', dark: '25 22% 28%' },
  '--color-coffeeShades-row3': { light: '25 35% 66%', dark: '25 20% 34%' },

  // Beer shades
  '--color-beerShades-row1': { light: '42 65% 72%', dark: '42 30% 22%' },
  '--color-beerShades-row2': { light: '42 60% 64%', dark: '42 28% 28%' },

  // Wine shades
  '--color-wineShades-row1': { light: '350 45% 65%', dark: '350 25% 24%' },
  '--color-wineShades-row2': { light: '350 40% 56%', dark: '350 22% 30%' },
  '--color-wineShades-row3': { light: '350 35% 48%', dark: '350 20% 36%' },

  // Tea shades
  '--color-teaShades-row1': { light: '80 40% 82%', dark: '80 22% 22%' },
  '--color-teaShades-row2': { light: '80 38% 74%', dark: '80 20% 28%' },

  // Green shades (Savory)
  '--color-greenShades-row1': { light: '140 40% 82%', dark: '140 22% 22%' },
  '--color-greenShades-row2': { light: '140 38% 74%', dark: '140 20% 26%' },
  '--color-greenShades-row3': { light: '140 35% 66%', dark: '140 18% 30%' },

  // Blue shades (Mixed Drinks)
  '--color-blueShades-row1': { light: '210 45% 82%', dark: '210 25% 22%' },
  '--color-blueShades-row2': { light: '210 42% 74%', dark: '210 22% 26%' },
  '--color-blueShades-row3': { light: '210 40% 66%', dark: '210 20% 30%' },
  '--color-blueShades-row4': { light: '210 38% 58%', dark: '210 18% 34%' },
  '--color-blueShades-row5': { light: '210 35% 50%', dark: '210 16% 38%' },

  // Purple shades (Cocktails)
  '--color-purpleShades-row1': { light: '270 40% 78%', dark: '270 22% 24%' },
  '--color-purpleShades-row2': { light: '270 38% 70%', dark: '270 20% 30%' },

  // Spritz shades
  '--color-spritzShades-row1': { light: '20 70% 75%', dark: '20 30% 24%' },
  '--color-spritzShades-row2': { light: '20 65% 67%', dark: '20 28% 30%' },

  // Orange shades (Juices/Smoothies/Soda)
  '--color-orangeShades-row1': { light: '30 65% 82%', dark: '30 28% 22%' },
  '--color-orangeShades-row2': { light: '30 60% 76%', dark: '30 26% 26%' },
  '--color-orangeShades-row3': { light: '30 55% 70%', dark: '30 24% 30%' },
  '--color-orangeShades-row4': { light: '30 50% 64%', dark: '30 22% 34%' },
  '--color-orangeShades-row5': { light: '30 45% 58%', dark: '30 20% 38%' },

  // Grayish shades (Other, Gelato)
  '--color-grayishShades-row1': { light: '220 10% 82%', dark: '220 6% 22%' },
  '--color-grayishShades-row2': { light: '220 8% 74%', dark: '220 5% 28%' },
  '--color-grayishShades-row3': { light: '220 6% 66%', dark: '220 4% 34%' },
  '--color-grayishShades-row4': { light: '220 5% 58%', dark: '220 3% 40%' },

  // Chart palette: dark-mode-aware colours for Chart.js/Recharts datasets
  '--chart-1': { light: '240 60% 44%', dark: '240 60% 70%' },
  '--chart-2': { light: '142 71% 45%', dark: '142 71% 60%' },
  '--chart-3': { light: '25 95% 53%', dark: '25 95% 68%' },
  '--chart-4': { light: '347 77% 50%', dark: '347 77% 65%' },
  '--chart-5': { light: '174 71% 39%', dark: '174 71% 60%' },
  '--chart-6': { light: '199 89% 48%', dark: '199 89% 63%' },
  '--chart-7': { light: '160 84% 39%', dark: '160 84% 55%' },
};

export type { Token, TokenMap };
