/**
 * Prime theme configuration
 * Primary: sky-600, Secondary: green-600
 */

export const primeTheme = {
  name: "prime",
  colors: {
    primary: "hsl(200 98% 39%)", // sky-600
    primaryFg: "hsl(0 0% 100%)",
    secondary: "hsl(142 76% 36%)", // green-600
    secondaryFg: "hsl(0 0% 100%)",
    accent: "hsl(142 76% 36%)", // green-600
    accentFg: "hsl(0 0% 100%)",
  },
} as const;

export type PrimeTheme = typeof primeTheme;
