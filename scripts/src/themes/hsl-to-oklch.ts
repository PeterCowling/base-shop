/**
 * HSL → OKLCH conversion script for reception theme migration.
 *
 * Converts all color values in packages/themes/reception/src/tokens.ts
 * from HSL format to OKLCH (CSS Color 4).
 *
 * Usage: pnpm tsx scripts/src/themes/hsl-to-oklch.ts
 *
 * Math references:
 *   - Björn Ottosson: https://bottosson.github.io/posts/oklab/
 *   - CSS Color 4: https://www.w3.org/TR/css-color-4/
 */

// ── Color math ──────────────────────────────────────────────────────────────

function hslToLinearRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  // sRGB
  const r = f(0);
  const g = f(8);
  const b = f(4);
  // Gamma expand to linear light
  const expand = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [expand(r), expand(g), expand(b)];
}

function linearRgbToOklch(rl: number, gl: number, bl: number): [number, number, number] {
  // Linear sRGB → LMS (Björn Ottosson M1)
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);

  // LMS_gamma → OKLab (Björn Ottosson M2)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bk = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  // OKLab → OKLCH
  const C = Math.sqrt(a * a + bk * bk);
  let H = Math.atan2(bk, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return [L, C, H];
}

function hslToOklch(h: number, s: number, l: number): string {
  const [rl, gl, bl] = hslToLinearRgb(h, s, l);
  const [L, C, H] = linearRgbToOklch(rl, gl, bl);
  // Round to reasonable precision: L=3dp, C=4dp, H=2dp
  const Lr = Math.round(L * 1000) / 1000;
  const Cr = Math.round(C * 10000) / 10000;
  const Hr = Math.round(H * 100) / 100;
  return `oklch(${Lr} ${Cr} ${Hr})`;
}

// ── Parsers ──────────────────────────────────────────────────────────────────

/** Parse `hsl(H S% L%)` → [h, s, l] */
function parseHslFull(value: string): [number, number, number] | null {
  const m = value.match(/^hsl\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

/** Parse raw triplet `H S% L%` → [h, s, l] */
function parseHslTriplet(value: string): [number, number, number] | null {
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

// ── Token definitions (from packages/themes/reception/src/tokens.ts) ─────────

const shadeTokens: Record<string, { light: string; dark: string }> = {
  '--color-pinkShades-row1': { light: 'hsl(330 55% 66%)', dark: 'hsl(330 25% 22%)' },
  '--color-pinkShades-row2': { light: 'hsl(330 55% 60%)', dark: 'hsl(330 25% 26%)' },
  '--color-pinkShades-row3': { light: 'hsl(330 50% 54%)', dark: 'hsl(330 22% 30%)' },
  '--color-pinkShades-row4': { light: 'hsl(330 45% 48%)', dark: 'hsl(330 20% 34%)' },
  '--color-coffeeShades-row1': { light: 'hsl(25 40% 60%)', dark: 'hsl(25 22% 22%)' },
  '--color-coffeeShades-row2': { light: 'hsl(25 40% 52%)', dark: 'hsl(25 22% 28%)' },
  '--color-coffeeShades-row3': { light: 'hsl(25 35% 44%)', dark: 'hsl(25 20% 34%)' },
  '--color-beerShades-row1': { light: 'hsl(42 65% 50%)', dark: 'hsl(42 30% 22%)' },
  '--color-beerShades-row2': { light: 'hsl(42 60% 42%)', dark: 'hsl(42 28% 28%)' },
  '--color-wineShades-row1': { light: 'hsl(350 45% 43%)', dark: 'hsl(350 25% 24%)' },
  '--color-wineShades-row2': { light: 'hsl(350 40% 34%)', dark: 'hsl(350 22% 30%)' },
  '--color-wineShades-row3': { light: 'hsl(350 35% 26%)', dark: 'hsl(350 20% 36%)' },
  '--color-teaShades-row1': { light: 'hsl(80 40% 60%)', dark: 'hsl(80 22% 22%)' },
  '--color-teaShades-row2': { light: 'hsl(80 38% 52%)', dark: 'hsl(80 20% 28%)' },
  '--color-greenShades-row1': { light: 'hsl(140 40% 60%)', dark: 'hsl(140 22% 22%)' },
  '--color-greenShades-row2': { light: 'hsl(140 38% 52%)', dark: 'hsl(140 20% 26%)' },
  '--color-greenShades-row3': { light: 'hsl(140 35% 44%)', dark: 'hsl(140 18% 30%)' },
  '--color-blueShades-row1': { light: 'hsl(210 45% 60%)', dark: 'hsl(210 25% 22%)' },
  '--color-blueShades-row2': { light: 'hsl(210 42% 52%)', dark: 'hsl(210 22% 26%)' },
  '--color-blueShades-row3': { light: 'hsl(210 40% 44%)', dark: 'hsl(210 20% 30%)' },
  '--color-blueShades-row4': { light: 'hsl(210 38% 36%)', dark: 'hsl(210 18% 34%)' },
  '--color-blueShades-row5': { light: 'hsl(210 35% 28%)', dark: 'hsl(210 16% 38%)' },
  '--color-purpleShades-row1': { light: 'hsl(270 40% 56%)', dark: 'hsl(270 22% 24%)' },
  '--color-purpleShades-row2': { light: 'hsl(270 38% 48%)', dark: 'hsl(270 20% 30%)' },
  '--color-spritzShades-row1': { light: 'hsl(20 70% 53%)', dark: 'hsl(20 30% 24%)' },
  '--color-spritzShades-row2': { light: 'hsl(20 65% 45%)', dark: 'hsl(20 28% 30%)' },
  '--color-orangeShades-row1': { light: 'hsl(30 65% 60%)', dark: 'hsl(30 28% 22%)' },
  '--color-orangeShades-row2': { light: 'hsl(30 60% 54%)', dark: 'hsl(30 26% 26%)' },
  '--color-orangeShades-row3': { light: 'hsl(30 55% 48%)', dark: 'hsl(30 24% 30%)' },
  '--color-orangeShades-row4': { light: 'hsl(30 50% 42%)', dark: 'hsl(30 22% 34%)' },
  '--color-orangeShades-row5': { light: 'hsl(30 45% 36%)', dark: 'hsl(30 20% 38%)' },
  '--color-grayishShades-row1': { light: 'hsl(220 10% 60%)', dark: 'hsl(220 6% 22%)' },
  '--color-grayishShades-row2': { light: 'hsl(220 8% 52%)', dark: 'hsl(220 5% 28%)' },
  '--color-grayishShades-row3': { light: 'hsl(220 6% 44%)', dark: 'hsl(220 4% 34%)' },
  '--color-grayishShades-row4': { light: 'hsl(220 5% 36%)', dark: 'hsl(220 3% 40%)' },
};

const semanticTokens: Record<string, { light: string; dark: string }> = {
  '--color-primary': { light: '142 72% 30%', dark: '142 70% 48%' },
  '--color-primary-fg': { light: '0 0% 100%', dark: '160 8% 4%' },
  '--color-primary-soft': { light: '142 60% 95%', dark: '142 50% 14%' },
  '--color-primary-hover': { light: '142 72% 25%', dark: '142 70% 54%' },
  '--color-primary-active': { light: '142 72% 20%', dark: '142 70% 58%' },
  '--color-accent': { light: '36 90% 50%', dark: '36 85% 58%' },
  '--color-accent-fg': { light: '0 0% 10%', dark: '0 0% 10%' },
  '--color-accent-soft': { light: '36 80% 95%', dark: '36 60% 16%' },
  '--surface-1': { light: '0 0% 100%', dark: '160 8% 4%' },
  '--surface-2': { light: '150 4% 96%', dark: '160 8% 8%' },
  '--surface-3': { light: '150 4% 92%', dark: '160 6% 12%' },
  '--surface-input': { light: '150 4% 97%', dark: '160 6% 10%' },
  '--color-bg': { light: '0 0% 100%', dark: '160 8% 4%' },
  '--color-fg': { light: '0 0% 10%', dark: '150 10% 92%' },
  '--color-fg-muted': { light: '0 0% 40%', dark: '150 5% 65%' },
  '--color-panel': { light: '150 4% 97%', dark: '160 6% 10%' },
  '--color-inset': { light: '150 4% 98%', dark: '160 8% 6%' },
  '--color-border': { light: '0 0% 80%', dark: '150 6% 22%' },
  '--color-border-strong': { light: '0 0% 65%', dark: '150 6% 35%' },
  '--color-border-muted': { light: '0 0% 88%', dark: '150 5% 16%' },
  '--color-focus-ring': { light: '142 72% 30%', dark: '142 70% 48%' },
  '--ring': { light: '142 72% 30%', dark: '142 70% 48%' },
  '--color-link': { light: '142 60% 28%', dark: '142 65% 60%' },
  '--color-muted': { light: '150 4% 88%', dark: '150 5% 24%' },
  '--color-muted-fg': { light: '0 0% 20%', dark: '150 5% 85%' },
  '--chart-1': { light: '240 60% 44%', dark: '240 60% 70%' },
  '--chart-2': { light: '142 71% 45%', dark: '142 71% 60%' },
  '--chart-3': { light: '25 95% 53%', dark: '25 95% 68%' },
  '--chart-4': { light: '347 77% 50%', dark: '347 77% 65%' },
  '--chart-5': { light: '174 71% 39%', dark: '174 71% 60%' },
  '--chart-6': { light: '199 89% 48%', dark: '199 89% 63%' },
  '--chart-7': { light: '160 84% 39%', dark: '160 84% 55%' },
};

// ── Main ─────────────────────────────────────────────────────────────────────

function convertGroup(
  label: string,
  tokens: Record<string, { light: string; dark: string }>,
  parse: (v: string) => [number, number, number] | null,
) {
  console.log(`\n// ── ${label} ────────────────────────────────────────────`);
  for (const [name, { light, dark }] of Object.entries(tokens)) {
    const lp = parse(light);
    const dp = parse(dark);
    if (!lp || !dp) {
      console.warn(`  SKIP ${name}: could not parse "${light}" / "${dark}"`);
      continue;
    }
    const lightOklch = hslToOklch(...lp);
    const darkOklch = hslToOklch(...dp);
    console.log(`  '${name}': { light: '${lightOklch}', dark: '${darkOklch}' },`);
    console.log(`  //   was: { light: '${light}', dark: '${dark}' }`);
  }
}

console.log('// ================================================================');
console.log('// OKLCH values for packages/themes/reception/src/tokens.ts');
console.log('// Generated by scripts/src/themes/hsl-to-oklch.ts');
console.log('// ================================================================');

convertGroup('SHADE TOKENS', shadeTokens, parseHslFull);
convertGroup('SEMANTIC TOKENS', semanticTokens, parseHslTriplet);
