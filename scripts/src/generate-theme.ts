import { parseToHsl } from "polished";

/**
 * Generate a minimal token map based on a primary color.
 * Returns CSS variable overrides for both light and dark modes.
 */
export function generateTheme(primary: string): Record<string, string> {
  const { hue, saturation, lightness } = parseToHsl(primary);
  const h = Math.round(hue);
  const s = Math.round(saturation * 100);
  const l = Math.round(lightness * 100);
  const darkL = Math.min(100, l + 10);

  const toHsl = (hh: number, ss: number, ll: number) => `${hh} ${ss}% ${ll}%`;

  const primaryLight = toHsl(h, s, l);
  const primaryDark = toHsl(h, s, darkL);
  const fgLight = l > 50 ? "0 0% 10%" : "0 0% 100%";
  const fgDark = darkL > 50 ? "0 0% 10%" : "0 0% 100%";

  return {
    "--color-primary": primaryLight,
    "--color-primary-dark": primaryDark,
    "--color-primary-fg": fgLight,
    "--color-primary-fg-dark": fgDark,
  };
}

if (process.argv[1] && process.argv[1].includes("generate-theme")) {
  const color = process.argv[2];
  if (!color) {
    console.error("Usage: ts-node scripts/src/generate-theme.ts <primary-color>");
    process.exit(1);
  }
  console.log(JSON.stringify(generateTheme(color), null, 2));
}
