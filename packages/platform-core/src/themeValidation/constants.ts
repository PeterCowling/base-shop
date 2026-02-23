import type { ThemeContrastRequirement } from "./types";

const COLOR_KEY_PREFIXES = [
  "--color-",
  "--surface-",
  "--overlay-",
  "--hero-",
  "--border-",
  "--gradient-",
  "--hospitality-",
] as const;

const COLOR_KEY_EXACT = new Set<string>([
  "--ring",
  "--ring-offset",
]);

const NON_COLOR_KEY_PREFIXES = [
  "--space-",
  "--radius-",
  "--font-",
  "--text-",
  "--leading-",
  "--z-",
  "--target-",
  "--bp-",
  "--safe-",
  "--shadow-",
  "--elevation-",
] as const;

export const DEFAULT_THEME_CONTRAST_REQUIREMENTS: readonly ThemeContrastRequirement[] = [
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-bg",
    minimumContrast: 4.5,
    label: "Body text on page background",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--surface-1",
    minimumContrast: 4.5,
    label: "Body text on surface-1",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--surface-2",
    minimumContrast: 4.5,
    label: "Body text on surface-2",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--surface-3",
    minimumContrast: 4.5,
    label: "Body text on surface-3",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--surface-input",
    minimumContrast: 4.5,
    label: "Body text on inputs",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-muted",
    minimumContrast: 4.5,
    label: "Body text on muted surfaces",
  },
  {
    foregroundToken: "--color-primary-fg",
    backgroundToken: "--color-primary",
    minimumContrast: 4.5,
    label: "Primary foreground on primary surface",
  },
  {
    foregroundToken: "--color-accent-fg",
    backgroundToken: "--color-accent",
    minimumContrast: 4.5,
    label: "Accent foreground on accent surface",
  },
  {
    foregroundToken: "--color-success-fg",
    backgroundToken: "--color-success",
    minimumContrast: 4.5,
    label: "Success foreground on success surface",
  },
  {
    foregroundToken: "--color-info-fg",
    backgroundToken: "--color-info",
    minimumContrast: 4.5,
    label: "Info foreground on info surface",
  },
  {
    foregroundToken: "--color-warning-fg",
    backgroundToken: "--color-warning",
    minimumContrast: 4.5,
    label: "Warning foreground on warning surface",
  },
  {
    foregroundToken: "--color-danger-fg",
    backgroundToken: "--color-danger",
    minimumContrast: 4.5,
    label: "Danger foreground on danger surface",
  },
  {
    foregroundToken: "--color-primary-fg",
    backgroundToken: "--color-primary-soft",
    minimumContrast: 4.5,
    label: "Primary foreground on primary-soft surface",
  },
  {
    foregroundToken: "--color-accent-fg",
    backgroundToken: "--color-accent-soft",
    minimumContrast: 4.5,
    label: "Accent foreground on accent-soft surface",
  },
  {
    foregroundToken: "--color-success-fg",
    backgroundToken: "--color-success-soft",
    minimumContrast: 4.5,
    label: "Success foreground on success-soft surface",
  },
  {
    foregroundToken: "--color-info-fg",
    backgroundToken: "--color-info-soft",
    minimumContrast: 4.5,
    label: "Info foreground on info-soft surface",
  },
  {
    foregroundToken: "--color-warning-fg",
    backgroundToken: "--color-warning-soft",
    minimumContrast: 4.5,
    label: "Warning foreground on warning-soft surface",
  },
  {
    foregroundToken: "--color-danger-fg",
    backgroundToken: "--color-danger-soft",
    minimumContrast: 4.5,
    label: "Danger foreground on danger-soft surface",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-primary-soft",
    minimumContrast: 4.5,
    label: "Body text on primary-soft surface",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-accent-soft",
    minimumContrast: 4.5,
    label: "Body text on accent-soft surface",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-success-soft",
    minimumContrast: 4.5,
    label: "Body text on success-soft surface",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-info-soft",
    minimumContrast: 4.5,
    label: "Body text on info-soft surface",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-warning-soft",
    minimumContrast: 4.5,
    label: "Body text on warning-soft surface",
  },
  {
    foregroundToken: "--color-fg",
    backgroundToken: "--color-danger-soft",
    minimumContrast: 4.5,
    label: "Body text on danger-soft surface",
  },
  {
    foregroundToken: "--color-muted-fg",
    backgroundToken: "--color-bg",
    minimumContrast: 4.5,
    label: "Muted text on page background",
  },
  {
    foregroundToken: "--color-muted-fg",
    backgroundToken: "--surface-1",
    minimumContrast: 4.5,
    label: "Muted text on surface-1",
  },
  {
    foregroundToken: "--color-muted-fg",
    backgroundToken: "--surface-2",
    minimumContrast: 4.5,
    label: "Muted text on surface-2",
  },
  {
    foregroundToken: "--color-muted-fg",
    backgroundToken: "--surface-3",
    minimumContrast: 4.5,
    label: "Muted text on surface-3",
  },
  {
    foregroundToken: "--color-muted-fg",
    backgroundToken: "--color-muted",
    minimumContrast: 4.5,
    label: "Muted text on muted surface",
  },
  {
    foregroundToken: "--color-link",
    backgroundToken: "--color-bg",
    minimumContrast: 4.5,
    label: "Link text on page background",
  },
  {
    foregroundToken: "--color-link",
    backgroundToken: "--surface-1",
    minimumContrast: 4.5,
    label: "Link text on surface-1",
  },
  {
    foregroundToken: "--color-link",
    backgroundToken: "--surface-2",
    minimumContrast: 4.5,
    label: "Link text on surface-2",
  },
  {
    foregroundToken: "--color-link",
    backgroundToken: "--surface-3",
    minimumContrast: 4.5,
    label: "Link text on surface-3",
  },
  {
    foregroundToken: "--ring",
    backgroundToken: "--surface-2",
    minimumContrast: 3,
    label: "Focus ring against raised surface",
  },
  {
    foregroundToken: "--border-2",
    backgroundToken: "--surface-2",
    minimumContrast: 3,
    label: "Border contrast on raised surface",
  },
];

export function isCssCustomPropertyName(token: string): boolean {
  return /^--[a-z0-9-_]+$/i.test(token);
}

export function isColorTokenKey(token: string): boolean {
  if (token.startsWith("--hospitality-motion-")) return false;
  if (token.endsWith("-width")) return false;
  if (NON_COLOR_KEY_PREFIXES.some((prefix) => token.startsWith(prefix))) return false;
  if (COLOR_KEY_EXACT.has(token)) return true;
  return COLOR_KEY_PREFIXES.some((prefix) => token.startsWith(prefix));
}
