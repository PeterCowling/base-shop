/**
 * @deprecated Use the shared monorepo script instead:
 *   node scripts/generate-logo-assets.mjs --app-dir apps/caryina --name Caryina \
 *     --icon-char y --primary "#E29CA2" --accent "#ABC4AF" --bg "#FAF9F7" \
 *     --font-family "Cormorant Garamond"
 *
 * This Caryina-specific script is kept for reference but is superseded by
 * scripts/generate-logo-assets.mjs which is parametrised and works for any business.
 *
 * Generate raster logo assets from SVG source files using Playwright + sharp.
 *
 * Usage: node apps/caryina/scripts/generate-logo-assets.mjs
 *
 * Outputs to apps/caryina/public/:
 *   favicon.svg          — SVG favicon (copied from logo-icon.svg, no changes)
 *   apple-touch-icon.png — 180×180 PNG for iOS home screen
 *   icon-192.png         — 192×192 PNG for PWA manifest
 *   icon-512.png         — 512×512 PNG for PWA manifest
 *   og-image.png         — 1200×630 PNG for Open Graph / social sharing
 *   og-image.webp        — WebP version of og-image
 */

/* eslint-disable ds/no-raw-color, ds/no-raw-font -- CARYINA-104 script renders fixed brand assets from approved palette/font */
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

async function renderSvgToPng(browser, svgPath, width, height) {
  // Resolved from known local asset paths in this script.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CARYINA-104 svgPath is resolved from controlled local files
  const svgContent = readFileSync(svgPath, "utf-8");
  const page = await browser.newPage();

  await page.setViewportSize({ width, height });

  // Serve the SVG as an HTML page so Google Fonts loads correctly
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
        img { width: 100%; height: 100%; display: block; }
      </style>
    </head>
    <body>
      <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}" />
    </body>
    </html>
  `);

  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready);
  // Extra tick to ensure the font actually renders
  await page.waitForTimeout(500);

  const buffer = await page.screenshot({ type: "png" });
  await page.close();
  return buffer;
}

async function main() {
  console.info("Starting logo asset generation...");

  const browser = await chromium.launch();

  try {
    // 1. SVG favicon — just copy the icon SVG
    console.info("Copying favicon.svg...");
    copyFileSync(
      resolve(publicDir, "logo-icon.svg"),
      resolve(publicDir, "favicon.svg")
    );

    // 2. Apple touch icon — 180×180 PNG (square icon)
    console.info("Rendering apple-touch-icon.png (180×180)...");
    const icon180 = await renderSvgToPng(
      browser,
      resolve(publicDir, "logo-icon.svg"),
      180,
      180
    );
    writeFileSync(resolve(publicDir, "apple-touch-icon.png"), icon180);

    // 3. PWA icons
    console.info("Rendering icon-192.png (192×192)...");
    const icon192 = await sharp(icon180).resize(192, 192).png().toBuffer();
    writeFileSync(resolve(publicDir, "icon-192.png"), icon192);

    console.info("Rendering icon-512.png (512×512)...");
    const icon512 = await renderSvgToPng(
      browser,
      resolve(publicDir, "logo-icon.svg"),
      512,
      512
    );
    writeFileSync(resolve(publicDir, "icon-512.png"), icon512);

    // 4. OG image — 1200×630 (wordmark on warm ivory background)
    // We render the wordmark SVG inside a 1200×630 container, centred
    console.info("Rendering og-image.png (1200×630)...");
    const ogPage = await browser.newPage();
    await ogPage.setViewportSize({ width: 1200, height: 630 });

    await ogPage.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;500&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 1200px; height: 630px;
            background: #FAF9F7;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .wordmark {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 96px;
            letter-spacing: 14px;
            white-space: nowrap;
          }
          .main { font-weight: 500; color: #E29CA2; }
          .accent { font-weight: 300; color: #ABC4AF; }
        </style>
      </head>
      <body>
        <span class="wordmark">
          <span class="main">Cari</span><span class="accent">y</span><span class="main">ina</span>
        </span>
      </body>
      </html>
    `);

    await ogPage.waitForFunction(() => document.fonts.ready);
    await ogPage.waitForTimeout(600);

    const ogPng = await ogPage.screenshot({ type: "png" });
    writeFileSync(resolve(publicDir, "og-image.png"), ogPng);
    await ogPage.close();

    // 5. WebP version of OG image
    console.info("Converting og-image to WebP...");
    const ogWebp = await sharp(ogPng).webp({ quality: 92 }).toBuffer();
    writeFileSync(resolve(publicDir, "og-image.webp"), ogWebp);

    console.info("\nDone. Generated files:");
    console.info("  public/favicon.svg");
    console.info("  public/apple-touch-icon.png  (180×180)");
    console.info("  public/icon-192.png          (192×192)");
    console.info("  public/icon-512.png          (512×512)");
    console.info("  public/og-image.png          (1200×630)");
    console.info("  public/og-image.webp         (1200×630)");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
