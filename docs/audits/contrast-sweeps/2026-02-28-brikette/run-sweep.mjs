/**
 * Brikette contrast + uniformity sweep
 * Breakpoints: 375, 768, 1280, 1920 — light mode (dark mode follow-up)
 * Routes: homepage, dorms, dorm detail, book
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3012';
const ROUTES = [
  { id: 'home',         url: `${BASE}/en`,               label: 'Homepage' },
  { id: 'dorms',        url: `${BASE}/en/dorms`,          label: 'Dorm listing' },
  { id: 'dorm-detail',  url: `${BASE}/en/dorms/room_10`,  label: 'Dorm detail' },
  { id: 'book',         url: `${BASE}/en/book`,            label: 'Booking form' },
];

const BREAKPOINTS = [375, 768, 1280, 1920];

// WCAG 2.x contrast helpers
function sRGB(v) {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(r, g, b) {
  return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
}
function contrastRatio(c1, c2) {
  const l1 = luminance(...c1), l2 = luminance(...c2);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}

// Injected into the page to collect computed styles
const COLLECTOR = `
(function() {
  function sRGB(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(r, g, b) { return 0.2126*sRGB(r) + 0.7152*sRGB(g) + 0.0722*sRGB(b); }
  function cr(c1, c2) {
    const l1 = lum(...c1), l2 = lum(...c2);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
  }
  function parseRGB(s) {
    if (!s) return null;
    const m = s.match(/rgba?\\((\\d+),?\\s*(\\d+),?\\s*(\\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function getEffectiveBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      node = node.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }
  function check(selector, label) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return { label, found: false };
    const results = [];
    const limit = Math.min(els.length, 5);
    for (let i = 0; i < limit; i++) {
      const el = els[i];
      const cs = getComputedStyle(el);
      const fgStr = cs.color;
      const bgStr = getEffectiveBg(el);
      const fg = parseRGB(fgStr);
      const bg = parseRGB(bgStr);
      const ratio = fg && bg ? cr(fg, bg) : null;
      const rect = el.getBoundingClientRect();
      results.push({
        fg: fgStr, bg: bgStr, ratio,
        fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        visible: rect.width > 0 && rect.height > 0,
        textContent: el.textContent?.trim().slice(0, 60) || ''
      });
    }
    return { label, found: true, results };
  }

  const checks = [
    check('header', 'Header container'),
    check('header a', 'Header nav links'),
    check('header button', 'Header buttons'),
    check('[class*="promo"],[class*="Promo"],[class*="announcement"],[class*="Announcement"]', 'Promo/announcement banner'),
    check('h1', 'H1 heading'),
    check('h2', 'H2 heading'),
    check('h3', 'H3 heading'),
    check('p', 'Body paragraphs'),
    check('main a:not(nav a)', 'Body links'),
    check('button, [role="button"]', 'Buttons'),
    check('input, textarea, select', 'Form inputs'),
    check('label', 'Form labels'),
    check('footer', 'Footer container'),
    check('footer a', 'Footer links'),
    check('footer p, footer span, footer li', 'Footer text'),
    check('[class*="card"] h2,[class*="card"] h3,[class*="Card"] h2,[class*="Card"] h3', 'Card headings'),
    check('[class*="card"] p,[class*="Card"] p', 'Card body text'),
    check('[class*="price"],[class*="Price"]', 'Price text'),
    check('[class*="badge"],[class*="Badge"],[class*="tag"],[class*="Tag"]', 'Badges/tags'),
    check('[class*="muted"],[class*="Muted"],[class*="secondary"]', 'Muted/secondary text'),
    check('[placeholder]', 'Input placeholders'),
  ];

  return JSON.stringify(checks);
})()
`;

async function sweep() {
  const browser = await chromium.launch({ headless: true });
  const findings = {};

  for (const bp of BREAKPOINTS) {
    console.log(`\n=== Breakpoint ${bp}px ===`);
    findings[bp] = {};

    for (const route of ROUTES) {
      console.log(`  → ${route.label}`);
      const ctx = await browser.newContext({ viewport: { width: bp, height: 900 } });
      const page = await ctx.newPage();

      try {
        await page.goto(route.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500); // let any hydration settle

        // Screenshot
        const ssName = `${bp}px-${route.id}.png`;
        await page.screenshot({
          path: path.join(OUT, ssName),
          fullPage: false,
        });
        console.log(`    screenshot: ${ssName}`);

        // Contrast data
        const data = await page.evaluate(COLLECTOR);
        findings[bp][route.id] = JSON.parse(data);
      } catch (e) {
        console.error(`    ERROR: ${e.message}`);
        findings[bp][route.id] = { error: e.message };
      }

      await ctx.close();
    }
  }

  await browser.close();

  // Save raw findings
  const rawPath = path.join(__dirname, 'raw-findings.json');
  fs.writeFileSync(rawPath, JSON.stringify(findings, null, 2));
  console.log(`\nRaw findings saved: ${rawPath}`);

  // Analyze findings
  const THRESHOLDS = {
    normal: 4.5,   // <18pt or <14pt bold
    large: 3.0,    // >=18pt or >=14pt bold
    nonText: 3.0,
  };

  function isLargeText(fs, fw) {
    const px = parseFloat(fs);
    const weight = parseInt(fw);
    if (isNaN(px)) return false;
    return px >= 24 || (px >= 18.67 && weight >= 700);
  }

  const failures = [];
  const warnings = [];

  for (const [bp, routes] of Object.entries(findings)) {
    for (const [routeId, checks] of Object.entries(routes)) {
      if (!Array.isArray(checks)) continue;
      const route = ROUTES.find(r => r.id === routeId);
      for (const check of checks) {
        if (!check.found || !check.results) continue;
        for (const r of check.results) {
          if (!r.visible || r.ratio === null) continue;
          const large = isLargeText(r.fontSize, r.fontWeight);
          const threshold = large ? THRESHOLDS.large : THRESHOLDS.normal;
          if (r.ratio < threshold) {
            const sev = r.ratio < threshold * 0.7 ? 'S1' : r.ratio < threshold ? 'S2' : 'S3';
            const finding = {
              sev,
              bp: `${bp}px`,
              route: route?.label || routeId,
              routeId,
              element: check.label,
              text: r.textContent,
              fg: r.fg,
              bg: r.bg,
              ratio: r.ratio,
              threshold,
              fontSize: r.fontSize,
              fontWeight: r.fontWeight,
              large,
              mode: 'light',
            };
            if (sev === 'S1' || sev === 'S2') failures.push(finding);
            else warnings.push(finding);
          }
        }
      }
    }
  }

  const analysisPath = path.join(__dirname, 'contrast-findings.json');
  fs.writeFileSync(analysisPath, JSON.stringify({ failures, warnings }, null, 2));
  console.log(`\nContrast analysis saved: ${analysisPath}`);
  console.log(`Failures (S1+S2): ${failures.length}`);
  console.log(`Warnings (S3): ${warnings.length}`);

  if (failures.length > 0) {
    console.log('\n--- FAILURES ---');
    for (const f of failures) {
      console.log(`[${f.sev}] ${f.bp} ${f.route} / ${f.element}: ratio ${f.ratio} (need ${f.threshold}) fg=${f.fg} bg=${f.bg}`);
    }
  }
}

sweep().catch(e => { console.error(e); process.exit(1); });
