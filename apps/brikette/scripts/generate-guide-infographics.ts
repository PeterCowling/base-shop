/* eslint-disable security/detect-non-literal-fs-filename -- SEO-1020 [ttl=2026-12-31] Build-time generator writes only within the Brikette public img directory. */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

type QuickGuideInfographic = {
  id: string;
  size: { width: number; height: number };
  title: string;
  subtitle: string;
  bullets: string[];
  note: string;
  brandLine: string;
  outputPath: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");

const toDataUrl = (mime: string, bytes: Uint8Array): string =>
  `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

async function renderInfographicPng(
  infographic: QuickGuideInfographic,
): Promise<Buffer> {
  const poppinsVar = await readFile(path.join(APP_ROOT, "public", "fonts", "poppins-var.woff2"));

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root {
          --bg: #f5f7ff;
          --card-bg: #ffffff;
          --border: #d9dee7;
          --text: #0f172a;
          --muted: #475569;
          --muted-2: #64748b;
        }

        @font-face {
          font-family: "Poppins";
          src: url("${toDataUrl("font/woff2", poppinsVar)}") format("woff2-variations");
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: var(--bg);
        }

        .frame {
          width: ${infographic.size.width}px;
          height: ${infographic.size.height}px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card {
          width: calc(100% - 120px);
          height: calc(100% - 120px);
          background: var(--card-bg);
          border: 3px solid var(--border);
          border-radius: 36px;
          box-sizing: border-box;
          padding: 54px 64px 46px;
          font-family: "Poppins", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          color: var(--text);
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 72px;
          line-height: 1.02;
          letter-spacing: -0.03em;
          font-weight: 800;
          margin: 0 0 14px 0;
        }

        .subtitle {
          font-size: 34px;
          line-height: 1.25;
          font-weight: 500;
          color: var(--muted);
          margin: 0 0 26px 0;
        }

        .bullets {
          margin: 0;
          padding-left: 44px;
          font-size: 34px;
          line-height: 1.34;
          font-weight: 500;
          color: var(--text);
        }

        .bullets li {
          margin: 14px 0;
        }

        .bullets li::marker {
          color: var(--text);
        }

        .footer {
          margin-top: auto;
          padding-top: 22px;
        }

        .note {
          font-size: 28px;
          line-height: 1.25;
          font-weight: 500;
          color: var(--muted);
          margin: 0 0 10px 0;
        }

        .brand {
          font-size: 24px;
          line-height: 1.2;
          font-weight: 500;
          color: var(--muted-2);
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="frame">
        <section class="card" aria-label="${infographic.title}">
          <h1 class="title">${infographic.title}</h1>
          <p class="subtitle">${infographic.subtitle}</p>
          <ul class="bullets">
            ${infographic.bullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
          <footer class="footer">
            <p class="note">${infographic.note}</p>
            <p class="brand">${infographic.brandLine}</p>
          </footer>
        </section>
      </div>
    </body>
  </html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: infographic.size,
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "load" });
    return await page.screenshot({ type: "png" });
  } finally {
    await browser.close();
  }
}

async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeWebpFromPngBuffer(outPath: string, png: Buffer): Promise<void> {
  await ensureParentDir(outPath);
  const webp = await sharp(png).webp({ quality: 86 }).toBuffer();
  await writeFile(outPath, webp);
}

const INFOGRAPHICS: QuickGuideInfographic[] = [
  {
    id: "gavitella-steps-return",
    size: { width: 1600, height: 900 },
    title: "Stairs & return plan",
    subtitle: "Gavitella is ~400 steps down from Piazza San Gennaro",
    bullets: [
      "Go light: small day bag only",
      "Hydrate before you start down",
      "Choose return: stairs / interno / boat (if running)",
      "Confirm the return before sunset events",
    ],
    note: "Tip: the climb feels harder after a long day in the sun",
    brandLine: "Hostel Brikette quick guide",
    outputPath: path.join(
      APP_ROOT,
      "public",
      "img",
      "guides",
      "gavitella-beach",
      "04-steps-and-return.webp",
    ),
  },
];

const parseArgs = (argv: string[]): { ids?: Set<string> } => {
  const ids: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--id") {
      const raw = argv[i + 1];
      if (typeof raw === "string" && raw.trim().length > 0) ids.push(raw.trim());
      i += 1;
      continue;
    }
    if (token.startsWith("--id=")) {
      const raw = token.slice("--id=".length).trim();
      if (raw.length > 0) ids.push(raw);
    }
  }
  return ids.length > 0 ? { ids: new Set(ids) } : {};
};

const main = async (): Promise<void> => {
  const { ids } = parseArgs(process.argv.slice(2));
  const selected = ids ? INFOGRAPHICS.filter((i) => ids.has(i.id)) : INFOGRAPHICS;

  if (selected.length === 0) {
    const known = INFOGRAPHICS.map((i) => i.id).sort().join(", ");
    console.error(`No matching infographics. Known ids: ${known}`);
    process.exitCode = 1;
    return;
  }

  for (const infographic of selected) {
    const png = await renderInfographicPng(infographic);
    await writeWebpFromPngBuffer(infographic.outputPath, png);
    // eslint-disable-next-line no-console -- script output
    console.log(`Wrote ${path.relative(process.cwd(), infographic.outputPath)}`);
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

