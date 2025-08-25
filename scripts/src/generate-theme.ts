import { loadBaseTokens } from "@acme/platform-core/createShop";

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (!/^([0-9a-f]{6})$/i.test(h)) {
    throw new Error("Invalid hex color");
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function generateThemeTokens(primary: string): Record<string, string> {
  const base = loadBaseTokens();
  const [r, g, b] = hexToRgb(primary);
  const [h, s, l] = rgbToHsl(r, g, b);
  const luminance = relativeLuminance(r, g, b);
  const fg = luminance > 0.5 ? "0 0% 10%" : "0 0% 100%";
  return {
    ...base,
    "--color-primary": `${h} ${s}% ${l}%`,
    "--color-primary-fg": fg,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const color = process.argv[2];
  if (!color) {
    console.error(
      "Usage: pnpm ts-node scripts/src/generate-theme.ts <hex-color>"
    );
    process.exit(1);
  }
  try {
    const tokens = generateThemeTokens(color);
    console.log(JSON.stringify(tokens, null, 2));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
