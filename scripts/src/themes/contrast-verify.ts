/**
 * Contrast ratio verification for OKLCH-migrated reception tokens.
 *
 * Verifies WCAG AA contrast ratios for key text/background pairs using
 * CSS Color 4 math (relative luminance from linear-light sRGB).
 *
 * WCAG AA requirements:
 *   - Normal text: ≥ 4.5:1
 *   - Large text / UI components: ≥ 3:1
 */

// ── OKLCH → XYZ → linear RGB ─────────────────────────────────────────────────

/** Parse `oklch(L C H)` string → [L, C, H] */
function parseOklch(value: string): [number, number, number] {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!m) throw new Error(`Cannot parse oklch: "${value}"`);
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

function oklchToLinearRgb(L: number, C: number, H: number): [number, number, number] {
  // OKLCH → OKLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS (inverse M2)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → linear sRGB (inverse M1)
  const rl = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [
    Math.max(0, Math.min(1, rl)),
    Math.max(0, Math.min(1, gl)),
    Math.max(0, Math.min(1, bl)),
  ];
}

/** Relative luminance per WCAG 2.1 */
function relativeLuminance(rl: number, gl: number, bl: number): number {
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio */
function contrastRatio(L1: number, L2: number): number {
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function oklchContrast(a: string, b: string): number {
  const [aL, aC, aH] = parseOklch(a);
  const [bL, bC, bH] = parseOklch(b);
  const aRgb = oklchToLinearRgb(aL, aC, aH);
  const bRgb = oklchToLinearRgb(bL, bC, bH);
  const lumA = relativeLuminance(...aRgb);
  const lumB = relativeLuminance(...bRgb);
  return contrastRatio(lumA, lumB);
}

// ── Token values ──────────────────────────────────────────────────────────────

const T = {
  // Light mode
  bgLight: 'oklch(1 0 89.88)',
  fgLight: 'oklch(0.216 0 89.88)',
  fgMutedLight: 'oklch(0.51 0 89.88)',
  primaryLight: 'oklch(0.538 0.141 149.79)',
  primaryFgLight: 'oklch(1 0 89.88)',
  accentLight: 'oklch(0.752 0.1641 66.87)',
  accentFgLight: 'oklch(0.216 0 89.88)',
  mutedLight: 'oklch(0.909 0.0031 165.05)',
  mutedFgLight: 'oklch(0.321 0 89.88)',
  borderLight: 'oklch(0.845 0 89.88)',
  linkLight: 'oklch(0.489 0.117 151.16)',
  surface2Light: 'oklch(0.97 0.001 165.11)',

  // Dark mode
  bgDark: 'oklch(0.147 0.003 174.11)',
  fgDark: 'oklch(0.941 0.0051 165)',
  fgMutedDark: 'oklch(0.73 0.0119 164.71)',
  primaryDark: 'oklch(0.753 0.2001 149.55)',
  primaryFgDark: 'oklch(0.147 0.003 174.11)',
  accentDark: 'oklch(0.778 0.1463 72.77)',
  accentFgDark: 'oklch(0.216 0 89.88)',
  mutedDark: 'oklch(0.366 0.0097 164.43)',
  mutedFgDark: 'oklch(0.887 0.0049 165)',
  linkDark: 'oklch(0.798 0.1668 152.62)',
  surface2Dark: 'oklch(0.196 0.0055 173.75)',
};

// ── Pairs to check ────────────────────────────────────────────────────────────

interface Check {
  label: string;
  fg: string;
  bg: string;
  type: 'normal' | 'large' | 'ui';
  threshold: number;
}

const checks: Check[] = [
  // Light mode — body text
  { label: 'Light: fg on bg', fg: T.fgLight, bg: T.bgLight, type: 'normal', threshold: 4.5 },
  { label: 'Light: fg on surface-2', fg: T.fgLight, bg: T.surface2Light, type: 'normal', threshold: 4.5 },
  { label: 'Light: muted-fg on bg', fg: T.mutedFgLight, bg: T.bgLight, type: 'normal', threshold: 4.5 },
  { label: 'Light: muted-fg on muted', fg: T.mutedFgLight, bg: T.mutedLight, type: 'normal', threshold: 4.5 },
  { label: 'Light: primary-fg on primary', fg: T.primaryFgLight, bg: T.primaryLight, type: 'ui', threshold: 3.0 },
  { label: 'Light: accent-fg on accent', fg: T.accentFgLight, bg: T.accentLight, type: 'ui', threshold: 3.0 },
  { label: 'Light: link on bg', fg: T.linkLight, bg: T.bgLight, type: 'normal', threshold: 4.5 },
  { label: 'Light: fg-muted on bg (informational text)', fg: T.fgMutedLight, bg: T.bgLight, type: 'large', threshold: 3.0 },

  // Dark mode — body text
  { label: 'Dark: fg on bg', fg: T.fgDark, bg: T.bgDark, type: 'normal', threshold: 4.5 },
  { label: 'Dark: fg on surface-2', fg: T.fgDark, bg: T.surface2Dark, type: 'normal', threshold: 4.5 },
  { label: 'Dark: muted-fg on bg', fg: T.mutedFgDark, bg: T.bgDark, type: 'normal', threshold: 4.5 },
  { label: 'Dark: muted-fg on muted', fg: T.mutedFgDark, bg: T.mutedDark, type: 'normal', threshold: 4.5 },
  { label: 'Dark: primary-fg on primary', fg: T.primaryFgDark, bg: T.primaryDark, type: 'ui', threshold: 3.0 },
  { label: 'Dark: accent-fg on accent', fg: T.accentFgDark, bg: T.accentDark, type: 'ui', threshold: 3.0 },
  { label: 'Dark: link on bg', fg: T.linkDark, bg: T.bgDark, type: 'normal', threshold: 4.5 },
  { label: 'Dark: fg-muted on bg (informational text)', fg: T.fgMutedDark, bg: T.bgDark, type: 'large', threshold: 3.0 },
];

// ── Run checks ────────────────────────────────────────────────────────────────

console.log('# Reception Theme OKLCH Contrast Verification\n');
console.log(`Generated: ${new Date().toISOString()}\n`);
console.log('WCAG AA thresholds: normal text ≥4.5:1 | large text / UI ≥3:1\n');
console.log('| Result | Pair | Ratio | Threshold | Type |');
console.log('|--------|------|-------|-----------|------|');

let passes = 0;
let failures = 0;

for (const check of checks) {
  try {
    const ratio = oklchContrast(check.fg, check.bg);
    const pass = ratio >= check.threshold;
    const symbol = pass ? 'PASS' : 'FAIL';
    console.log(
      `| ${symbol} | ${check.label} | ${ratio.toFixed(2)}:1 | ${check.threshold}:1 | ${check.type} |`,
    );
    if (pass) passes++;
    else failures++;
  } catch (e) {
    console.log(`| ERROR | ${check.label} | — | ${check.threshold}:1 | ${check.type} |`);
    failures++;
  }
}

console.log(`\n## Summary\n`);
console.log(`- Passed: ${passes}`);
console.log(`- Failed: ${failures}`);
console.log(`- Total: ${passes + failures}`);

if (failures > 0) {
  console.log('\n⚠️  Some pairs did not meet WCAG AA. Review failed pairs above.');
  process.exit(1);
} else {
  console.log('\n✓ All checked pairs meet WCAG AA requirements.');
}
