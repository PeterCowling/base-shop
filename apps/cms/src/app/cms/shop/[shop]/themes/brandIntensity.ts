// apps/cms/src/app/cms/shop/[shop]/themes/brandIntensity.ts
import { defaultPalette, type Mode, type Palette } from "@ui/lib/useThemePalette";

export type BrandIntensity = "Value" | "Everyday" | "Premium" | "Luxury";

// Only brand/accent tokens are remapped by intensity.
// Steps correspond to the 12-step ramps. These are initial choices aligned
// to the proposal: bolder for Value, default for Everyday, softer for Premium,
// and mostly tinted backgrounds for Luxury.
const intensitySteps: Record<BrandIntensity, Record<string, number>> = {
  Value: {
    "--color-primary-soft": 3,
    "--color-primary": 10,
    "--color-primary-hover": 11,
    "--color-primary-active": 11,
    "--color-accent-soft": 3,
    "--color-accent": 10,
  },
  Everyday: {
    "--color-primary-soft": 3,
    "--color-primary": 9,
    "--color-primary-hover": 10,
    "--color-primary-active": 11,
    "--color-accent-soft": 3,
    "--color-accent": 9,
  },
  Premium: {
    "--color-primary-soft": 3,
    "--color-primary": 7,
    "--color-primary-hover": 8,
    "--color-primary-active": 9,
    "--color-accent-soft": 3,
    "--color-accent": 7,
  },
  Luxury: {
    "--color-primary-soft": 3,
    "--color-primary": 4,
    "--color-primary-hover": 5,
    "--color-primary-active": 6,
    "--color-accent-soft": 3,
    "--color-accent": 4,
  },
};

const PRIMARY_KEYS = new Set([
  "--color-primary-soft",
  "--color-primary",
  "--color-primary-hover",
  "--color-primary-active",
]);
const ACCENT_KEYS = new Set(["--color-accent-soft", "--color-accent"]);

function isPrimary(key: string) {
  return PRIMARY_KEYS.has(key);
}
function isAccent(key: string) {
  return ACCENT_KEYS.has(key);
}

export function computeBrandOverlay(
  intensity: BrandIntensity,
  palette: Palette = defaultPalette,
  _mode: Mode = "light",
): Record<string, string> {
  const out: Record<string, string> = {};
  const steps = intensitySteps[intensity];
  Object.entries(steps).forEach(([k, step]) => {
    if (isPrimary(k)) out[k] = palette.primary[step as 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11];
    else if (isAccent(k)) out[k] = palette.accent[step as 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11];
  });
  return out;
}

