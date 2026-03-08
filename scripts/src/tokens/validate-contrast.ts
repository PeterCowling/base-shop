import fs from "node:fs";
import path from "node:path";

import { getContrast } from "polished";

import { tokens as baseTokens } from "../../../packages/themes/base/src/tokens";

type ThemeMode = "light" | "dark";

type ContrastPair = {
  label: string;
  fg: `--${string}`;
  bg: `--${string}`;
  minRatio: number;
};

type Waiver = {
  theme: string;
  mode: ThemeMode | "*";
  fg: `--${string}` | "*";
  bg: `--${string}` | "*";
  minRatio?: number;
  reason: string;
  expires: string;
};

const CONTRAST_PAIRS: ContrastPair[] = [
  { label: "fg on bg", fg: "--color-fg", bg: "--color-bg", minRatio: 4.5 },
  { label: "fg on surface-1", fg: "--color-fg", bg: "--surface-1", minRatio: 4.5 },
  { label: "fg on surface-2", fg: "--color-fg", bg: "--surface-2", minRatio: 4.5 },
  { label: "fg on surface-3", fg: "--color-fg", bg: "--surface-3", minRatio: 4.5 },
  { label: "muted fg on bg", fg: "--color-fg-muted", bg: "--color-bg", minRatio: 3 },
  { label: "link on bg", fg: "--color-link", bg: "--color-bg", minRatio: 4.5 },
  { label: "primary", fg: "--color-primary-fg", bg: "--color-primary", minRatio: 4.5 },
  { label: "accent", fg: "--color-accent-fg", bg: "--color-accent", minRatio: 4.5 },
  { label: "success", fg: "--color-success-fg", bg: "--color-success", minRatio: 4.5 },
  { label: "warning", fg: "--color-warning-fg", bg: "--color-warning", minRatio: 4.5 },
  { label: "info", fg: "--color-info-fg", bg: "--color-info", minRatio: 4.5 },
  { label: "danger", fg: "--color-danger-fg", bg: "--color-danger", minRatio: 4.5 },
  { label: "focus ring on bg", fg: "--color-focus-ring", bg: "--color-bg", minRatio: 3 },
];

function loadWaivers(): Waiver[] {
  const repoRoot = process.cwd();
  const waiversPath = path.join(repoRoot, "tools", "token-contrast", "waivers.json");
  if (!fs.existsSync(waiversPath)) return [];
  try {
    const raw = fs.readFileSync(waiversPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Waiver[]) : [];
  } catch {
    return [];
  }
}

function isExpired(dateString: string): boolean {
  const expiresAt = new Date(dateString);
  if (Number.isNaN(expiresAt.getTime())) return true;
  return expiresAt.getTime() < Date.now();
}

function matchesWaiver(
  waiver: Waiver,
  theme: string,
  mode: ThemeMode,
  pair: ContrastPair
): boolean {
  const themeOk = waiver.theme === "*" || waiver.theme === theme;
  const modeOk = waiver.mode === "*" || waiver.mode === mode;
  const fgOk = waiver.fg === "*" || waiver.fg === pair.fg;
  const bgOk = waiver.bg === "*" || waiver.bg === pair.bg;
  const ratioOk = waiver.minRatio === undefined || waiver.minRatio === pair.minRatio;
  return themeOk && modeOk && fgOk && bgOk && ratioOk;
}

function normalizeKey(raw: string): `--${string}` | null {
  if (!raw.startsWith("--")) return null;
  if (raw.startsWith("--token-")) {
    return `--${raw.slice("--token-".length)}` as `--${string}`;
  }
  return raw as `--${string}`;
}

function parseHslTriplet(value: string): { h: string; s: string; l: string; a?: string } | null {
  const hslWithAlpha = value.match(
    /([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?/i
  );
  if (!hslWithAlpha) return null;
  const [, h, s, l, a] = hslWithAlpha;
  return { h, s, l, a };
}

/** Convert oklch(L C H) to a hex color string using CSS Color 4 math. */
function oklchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS (inverse M2)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube root → linear
  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;

  // LMS → linear sRGB (inverse M1)
  const rl = Math.max(0, Math.min(1,  4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc));
  const gl = Math.max(0, Math.min(1, -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc));
  const bl = Math.max(0, Math.min(1, -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701  * sc));

  // Linear → gamma-compressed sRGB
  const compress = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  const r = Math.round(compress(rl) * 255);
  const g = Math.round(compress(gl) * 255);
  const b2 = Math.round(compress(bl) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
}

function normalizeColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("var(")) return null;
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) return trimmed;
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(trimmed)) return trimmed;

  // OKLCH: convert to hex for polished compat
  const oklch = trimmed.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i);
  if (oklch) {
    return oklchToHex(parseFloat(oklch[1]), parseFloat(oklch[2]), parseFloat(oklch[3]));
  }

  const hsl = parseHslTriplet(trimmed);
  if (!hsl) return null;
  if (hsl.a) {
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
  }
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function readThemeOverrides(themeId: string): Record<string, string> {
  const repoRoot = process.cwd();
  const cssPath = path.join(repoRoot, "packages", "themes", themeId, "tokens.css");
  if (!fs.existsSync(cssPath)) return {};
  const src = fs.readFileSync(cssPath, "utf8");
  const rootMatch = src.match(/:root\s*\{([\s\S]*?)\}/i);
  if (!rootMatch) return {};
  const map: Record<string, string> = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rootMatch[1]))) {
    const rawKey = `--${m[1]}`;
    const key = normalizeKey(rawKey);
    if (!key) continue;
    map[key] = m[2].trim();
  }
  return map;
}

function resolveToken(
  overrides: Record<string, string>,
  key: `--${string}`,
  mode: ThemeMode
): string | null {
  if (mode === "dark") {
    const darkKey = `${key}-dark` as `--${string}`;
    if (overrides[darkKey]) return overrides[darkKey];
  } else if (overrides[key]) {
    return overrides[key];
  }
  if (!(key in baseTokens)) return null;
  const base = baseTokens[key as keyof typeof baseTokens] as {
    light: string;
    dark?: string;
  };
  if (mode === "dark" && base.dark) return base.dark;
  return base.light;
}

function resolveColor(
  overrides: Record<string, string>,
  key: `--${string}`,
  mode: ThemeMode
): string | null {
  const raw = resolveToken(overrides, key, mode);
  if (!raw) return null;
  return normalizeColor(raw);
}

function listThemes(): string[] {
  const repoRoot = process.cwd();
  const themesDir = path.join(repoRoot, "packages", "themes");
  if (!fs.existsSync(themesDir)) return [];
  return fs
    .readdirSync(themesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((theme) => fs.existsSync(path.join(themesDir, theme, "tokens.css")));
}

function main(): void {
  const themes = listThemes();
  if (themes.length === 0) {
    console.log("No theme packages found with tokens.css.");
    return;
  }

  const waivers = loadWaivers();
  const issues: string[] = [];
  const skipped: string[] = [];
  const waived: string[] = [];
  const expired: string[] = [];

  for (const theme of themes) {
    const overrides = theme === "base" ? {} : readThemeOverrides(theme);
    for (const mode of ["light", "dark"] as ThemeMode[]) {
      for (const pair of CONTRAST_PAIRS) {
        const fg = resolveColor(overrides, pair.fg, mode);
        const bg = resolveColor(overrides, pair.bg, mode);
        if (!fg || !bg) {
          const waiver = waivers.find((entry) => matchesWaiver(entry, theme, mode, pair));
          if (waiver) {
            if (isExpired(waiver.expires)) {
              expired.push(`${theme} ${mode} ${pair.label} (waiver expired: ${waiver.expires})`);
            } else {
              waived.push(`${theme} ${mode} ${pair.label} (waived: ${waiver.reason})`);
            }
          } else {
            skipped.push(`${theme} ${mode} ${pair.label}`);
          }
          continue;
        }
        let ratio: number;
        try {
          ratio = getContrast(fg, bg);
        } catch {
          const waiver = waivers.find((entry) => matchesWaiver(entry, theme, mode, pair));
          if (waiver) {
            if (isExpired(waiver.expires)) {
              expired.push(`${theme} ${mode} ${pair.label} (waiver expired: ${waiver.expires})`);
            } else {
              waived.push(`${theme} ${mode} ${pair.label} (waived: ${waiver.reason})`);
            }
          } else {
            skipped.push(`${theme} ${mode} ${pair.label}`);
          }
          continue;
        }
        if (ratio < pair.minRatio) {
          const waiver = waivers.find((entry) => matchesWaiver(entry, theme, mode, pair));
          if (waiver) {
            if (isExpired(waiver.expires)) {
              expired.push(`${theme} ${mode} ${pair.label} (waiver expired: ${waiver.expires})`);
            } else {
              waived.push(
                `${theme} ${mode} ${pair.label}: ${ratio.toFixed(2)} < ${pair.minRatio} (waived: ${waiver.reason})`
              );
            }
          } else {
            issues.push(
              `${theme} ${mode} ${pair.label}: ${ratio.toFixed(2)} < ${pair.minRatio}`
            );
          }
        }
      }
    }
  }

  if (issues.length === 0 && skipped.length === 0 && expired.length === 0) {
    console.log("✅ Token contrast validation passed.");
  } else {
    console.log("❌ Token contrast validation failed:");
    for (const issue of issues) console.log(`  - ${issue}`);
    for (const issue of expired) console.log(`  - ${issue}`);
    for (const issue of skipped) console.log(`  - ${issue}`);
  }

  if (waived.length > 0) {
    console.log("\nℹ️  Waived pairs:");
    for (const entry of waived) {
      console.log(`  - ${entry}`);
    }
  }

  if (issues.length > 0 || skipped.length > 0 || expired.length > 0) {
    process.exit(1);
  }
}

main();
