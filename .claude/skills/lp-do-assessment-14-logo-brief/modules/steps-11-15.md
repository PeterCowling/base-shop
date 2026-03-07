### Step 11: Save artifact and report

Save the logo brief (see Output Contract below). Then continue to Steps 12–15.

---

### Step 12: Resolve icon character and app directory

**Icon character:**
- Read the brief's "Icon-only derivative" line from the Mark Type section.
- Extract the quoted character (e.g., `"y"` → `y`).
- Fallback: first letter of business name, lowercased.

**App directory:**
- If `--app-dir` was provided, use that path verbatim.
- Otherwise: construct `apps/<business-name-lowercase>` (e.g., business name "Caryina" → `apps/caryina`).
- Check whether the resolved directory exists on disk.
- If it does not exist: set `app-dir = null`. Skip Steps 13–14. Proceed to Step 15.

---

### Step 13: Write SVG source files

Write the following files to `<app-dir>/public/`:

**`logo-wordmark.svg`** — the full wordmark SVG.
- Split the business name around the icon character: `prefix` + `icon-char` + `suffix`.
- `prefix` and `suffix` in `--color-primary` hex, `font-weight: 500`.
- `icon-char` in `--color-accent` hex, `font-weight: 300`.
- `font-family`: the dossier heading font, with `Georgia, serif` as fallback.
- `letter-spacing`: wide (7px at 46px font size — matches brief typography guidance).
- `viewBox="0 0 320 88"`, `x="20"`, `y="59"`.
- Background rect: `--color-bg` (warm ivory) or fallback `#FAF9F7`.
- Google Fonts `@import` in CDATA style block.

**`logo-icon.svg`** — the standalone icon mark.
- Single character (icon-char) centred in a 200×200 square.
- `font-size: 140`, `font-weight: 300`, `fill: --color-accent`.
- Same background as wordmark.

Use the shared generation script instead of writing these manually if it is faster:
```
node scripts/generate-logo-assets.mjs \
  --app-dir <app-dir> \
  --name "<business-name>" \
  --icon-char "<icon-char>" \
  --primary "<primary-hex>" \
  --accent "<accent-hex>" \
  --bg "<bg-hex>" \
  --font-family "<heading-font-family>"
```

The script also completes Steps 13 and 14 in one run — see Step 14.

---

### Step 14: Generate raster assets and manifest

Run the shared generation script (if not already run in Step 13):

```
node scripts/generate-logo-assets.mjs \
  --app-dir <app-dir> \
  --name "<business-name>" \
  --icon-char "<icon-char>" \
  --primary "<primary-hex>" \
  --accent "<accent-hex>" \
  --bg "<bg-hex>" \
  --font-family "<heading-font-family>"
```

This produces in `<app-dir>/public/`:
- `favicon.svg` — copy of `logo-icon.svg`
- `apple-touch-icon.png` — 180×180 Playwright render
- `icon-192.png` — 192×192 PNG
- `icon-512.png` — 512×512 PNG
- `og-image.png` — 1200×630 PNG
- `og-image.webp` — 1200×630 WebP
- `site.webmanifest` — PWA manifest with name, icons, theme colour

Requires Playwright and sharp to be available in the monorepo (`playwright` and `sharp` are both dependencies).

---

### Step 15: Update Next.js layout metadata

Read `<app-dir>/src/app/layout.tsx` (root layout — the one that exports `metadata`, not the locale layout).

If `icons`, `openGraph`, `twitter`, and `manifest` keys are all already present in the `metadata` export: skip with a note "layout metadata already set — skipping."

Otherwise, add the missing keys to the `metadata` export:

```typescript
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "<business-name>",
    description: "<description from existing metadata>",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "<business-name>",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
```

If `app-dir = null` (app not found): skip this step. Include the following in the Completion Message instead:

> "App directory not found — logo assets not deployed. When the app is ready, run:
> `node scripts/generate-logo-assets.mjs --app-dir <dir> --name "<name>" --icon-char "<icon-char>" --primary "<hex>" --accent "<hex>" --bg "<hex>" --font-family "<family>"`
> Then add the metadata block to `<app-dir>/src/app/layout.tsx`."
