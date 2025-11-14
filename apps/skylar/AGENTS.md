You are building a small reference website for **Skylar SRL** inside the
`PeterCowling/base-shop` monorepo (Next.js 15 + React 19).  
Do **not** write any code until you have fully reasoned through:

- Route structure and content model
- i18n
- Typography & theming
- Performance strategy on **Cloudflare free tier**

---

## 1. Tech & repo context

- Monorepo: `PeterCowling/base-shop`.
- Apps live under `apps/*`; shared packages under `packages/*`. Next.js config is app‑owned and composed from `@acme/next-config` in each app:contentReference[oaicite:0]{index=0}.
- Tailwind CSS is configured at the root via `tailwind.config.mjs`, loading design tokens from `@acme/tailwind-config` / `@acme/design-tokens`.
- Existing apps use `@acme/i18n` / `next-intl` with:
  - `src/app/[lang]/layout.tsx` resolving locale and wrapping content in `TranslationsProvider`:contentReference[oaicite:1]{index=1}.
  - Translation JSON like `@i18n/en.json`.

**New app:** Create `apps/skylar` as a stand‑alone Next.js App Router project.

---

## 2. Brand, business & card text (canonical copy)

Use the **exact business‑card strings** as canonical content for the site.

### 2.1 Logo block (both cards)

Under the infinity logo:

- `SKYLAR SRL`
- `斯凯拉有限公司`
- `SINCE 2015`

### 2.2 English card text (front)

Right‑hand side of the card:

- `CRISTIANA MARZANO`
- `FOUNDER & CEO`
- `Product Design & China Sourcing`
- `Custom Distribution & Sales Platforms`
- `3-Hour Website Launch · Multilingual Markets`
  > If the printed card still says `Multilingual Markets Markets`, treat that as a typo and use the corrected single “Markets” on the website.
- `+39 334 904 8692`
- `cmcowling@me.com`
- `skylarsrl.com`

### 2.3 Chinese card text (back)

Right‑hand side text (grouped logically):

- `克里斯蒂安娜·马尔扎诺`
- `Cristiana Marzano`
- `Skylar 有限责任公司｜创始人兼首席执行官`
- `意大利公司｜成立于 2015 年`
- `产品设计与中国采购｜定制分销与销售平台`
- `自研建站平台：3 小时内上线｜服务全球多语言市场`
- `手机：+39 334 904 8692`
- `邮箱：cmcowling@me.com`
- `官网：skylarsrl.com`
- QR caption:
  - `微信扫一扫，加我为好友`
  - `微信：cristiana`

> Treat the above as the **source of truth** for personal & business copy.  
> All site text for Cristiana’s profile and the product business should reflect this wording (with normal localisation for IT/ZH).

### 2.4 Business lines

From the card + context:

1. **Products & Platforms (core business)**
   - Product design & sourcing (esp. from China).
   - Custom distribution & sales platforms for global markets.
   - Web platform to launch a new website in ~3 hours.
   - Operates in multilingual markets.

2. **Real estate – Hostel Brikette**
   - Skylar SRL owns/operates **Hostel Brikette** in Positano (Amalfi Coast).
   - Hostel Brikette has its own site: `https://hostel-positano.com`.
   - Skylar site gives a concise corporate overview + a **“Visit Hostel Brikette”** link for details/bookings (no booking logic on Skylar).

### 2.5 People & roles

Two peers with different responsibilities:

- **Cristiana Marzano** – **Product Design & Sourcing Director**
- **Peter Cowling** – **Distribution & Platforms Director**

On the site, they should feel equally senior; the titles clarify who does what.

---

## 3. Experience & layout goals

1. **Multilingual**
   - Locales: `en`, `it`, `zh`.
   - URL pattern: `/[lang]` with `en` as default and `localePrefix = "as-needed"` (so `/`, `/it`, `/zh`), which is standard for multilingual SEO:contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}.
   - Consistent layout across languages so users remain oriented when switching:contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}.

2. **Typography‑heavy EN/IT (oversized, minimal imagery)**
   - For English and Italian:
     - Oversized, bold typography is the **main visual element**.
     - Use a strong type scale (H1–H3, body, caption) with clear hierarchy:contentReference[oaicite:6]{index=6}.
     - Limit images to:
       - Logo
       - 1–2 subtle images (e.g. abstract background or a single hostel shot).
   - Users should be able to grasp “what Skylar does” and “who does what” in ~10–20 seconds via headings and bullets.

3. **Conservative business‑card style for ZH**
   - Visually echo the physical cards:
     - Dark charcoal/black background.
     - Gold or warm headings; high‑contrast light body text.
     - Card‑like panels with thin gold dividers.
   - Chinese copy closely follows the card text above.

4. **Tone**
   - Professional, calm, confident.
   - Short, declarative sentences that translate cleanly.

---

## 4. Routes & pages

Use App Router with locale segment: `src/app/[lang]/...`.

### 4.1 `src/app/[lang]/layout.tsx`

- Resolve `lang` ∈ {`en`,`it`,`zh`}.
- Load locale messages from `en.json`, `it.json`, `zh.json`.
- Wrap in `TranslationsProvider`.
- Header:
  - Logo block (SKYLAR SRL + Chinese name + SINCE 2015).
  - Nav links: Home, Products & Platforms, Real Estate, People.
  - Language switcher (text labels: English / Italiano / 中文; no flags).
- Footer:
  - Small line: “Skylar SRL · Italy · Since 2015” (localised).
- Apply locale‑aware theming classes:
  - `zh` → dark/gold theme.
  - `en`/`it` → light, editorial, typography‑heavy.

### 4.2 `/[lang]` – Landing

- Hero (EN example):
  - H1 (very large): “Skylar SRL”
  - H2: “Product design, sourcing, platforms, and hospitality.”
- Two large typographic “cards” for the businesses:

1. **Products & Platforms**
   - Headline: derived from `Product Design & China Sourcing`.
   - Sub‑copy uses card strings:
     - “Product Design & China Sourcing”
     - “Custom Distribution & Sales Platforms”
     - “3‑Hour Website Launch · Multilingual Markets”
   - CTA: “Explore products & platforms”.

2. **Hostel Brikette (Real Estate)**
   - Short summary: Skylar SRL operates Hostel Brikette in Positano; cliffside hostel with terrace, dorms and private rooms; Amalfi Coast base.
   - CTA: “Explore Hostel Brikette”.

- ZH version uses equivalent Chinese from the card (products) plus brief Chinese description of Hostel Brikette.

### 4.3 `/[lang]/products` – Products & Platforms

- Editorial, type‑driven page. Sections (EN):
  1. **Product Design & China Sourcing**  
     Use copy anchored on the card line `Product Design & China Sourcing`.

  2. **Custom Distribution & Sales Platforms**  
     Expand on that card line.

  3. **3‑Hour Website Launch**  
     Explain the rapid web‑creation platform.

  4. **Multilingual Markets**  
     Explain operation across languages and regions.

- Use oversized H1/H2, concise paragraphs, and bullet lists.
- Minimal images (e.g. one simple graphic or none).

### 4.4 `/[lang]/real-estate` – Hostel Brikette

- Short intro describing Hostel Brikette as Skylar’s real‑estate arm.
- Sections:
  - **Location** – Positano, Amalfi Coast; cliffside hostel with terrace and views.
  - **Guests & rooms** – dorms and privates, budget‑friendly.
  - **Experience** – social terrace/bar, good base for exploring Amalfi/Ravello/Sorrento/Capri.
- Big CTA button (localised):
  - “Visit Hostel Brikette” → `https://hostel-positano.com` (new tab).
- Clarify that bookings/info are on the hostel’s site, not Skylar.

### 4.5 `/[lang]/people` – Business card analogue

Two big, typographic profile cards:

**Cristiana:**

- H2: “CRISTIANA MARZANO” (caps, matching card)  
  ZH page: also show `克里斯蒂安娜·马尔扎诺`.
- Title: “FOUNDER & CEO” where mirroring card, plus clarifying subtitle “Product Design & Sourcing Director” in body copy.
- Company line: “Skylar SRL · Italy · Since 2015”.
- Services/summary:
  - Product Design & China Sourcing
  - Custom Distribution & Sales Platforms
  - 3‑Hour Website Launch · Multilingual Markets
- Contact (with card text):
  - +39 334 904 8692
  - cmcowling@me.com
  - skylarsrl.com
  - ZH labels: 手机 / 邮箱 / 官网
  - WeChat: “微信：cristiana” under a QR slot.

**Peter:**

- H2: “PETER COWLING”.
- Title: “Distribution & Platforms Director”.
- Company line as above.
- Summary emphasising:
  - Distribution & platforms
  - Multilingual markets
- Contact structured identically.

ZH `/people` adopts dark/gold business‑card theme; EN/IT versions use ultra‑modern editorial layout with giant names and roles.

---

## 5. i18n & copy model

- Locales: `en`, `it`, `zh`; default `en`.
- Use `localePrefix = "as-needed"` and `/[lang]` + `TranslationsProvider` pattern.
- Create `en.json`, `it.json`, `zh.json` for the Skylar app with keys for:
  - Navigation labels.
  - Hero and section headings.
  - Card copy (exact strings from business cards).
  - CTAs (“Explore…”, “Visit Hostel Brikette”, “Contact”, etc.).
  - People page labels (Phone/Email/Website, 手机/邮箱/官网).
- Ensure layout leaves slack for longer IT/ZH strings (no fixed-width text boxes).

---

## 6. Typography & styling (specific fonts)

Use Tailwind with a **tight, limited font system**:

### 6.1 Font families

From the available fonts list, define:

- **Display / headings:**
  - `Cinzel` (or `Cinzel Medium`) for:
    - Site logo title (“Skylar SRL”) on EN/IT.
    - Big H1/H2 headings.
    - Names on the People page (“CRISTIANA MARZANO”, “PETER COWLING”).
  - Fallback stack: `"Cinzel", "Times New Roman", serif`.

- **Body & UI:**
  - `Roboto` for:
    - Body text.
    - Navigation.
    - Buttons and small headings.
  - Fallback stack: `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`.

- **Chinese text:**
  - Use the same `Roboto` stack, relying on OS‑level fallbacks for Chinese glyphs (e.g. PingFang SC / Microsoft YaHei / Noto Sans CJK).
  - Keep ZH body in a sans serif for legibility.

### 6.2 Type scale (guidelines, later mapped to Tailwind classes)

Desktop (approx):

- H1: 3.5–4rem, tracking slightly tight.
- H2: 2.25–2.75rem.
- H3 / Section heading: 1.5–1.75rem.
- Body: 1rem–1.125rem.
- Small/caption: 0.875rem.

Mobile:

- H1: 2.25–2.5rem.
- H2: ~1.75–2rem.
- Body: ~0.95–1rem.

Use generous line‑height for dense copy (1.4–1.6 for body), and slightly tighter for headings.

### 6.3 Locale‑based theming

- **EN/IT theme:**
  - Background: `bg-white` or very light gray.
  - Text: dark slate/neutral.
  - Headings: `font-display` (Cinzel), bold.
  - Body: `font-sans` (Roboto).
  - Large, left‑aligned text blocks with wide margins and lots of breathing room.

- **ZH theme:**
  - Background: near‑black (`bg-zinc-950` equivalent).
  - Headings: gold (`text-[#d4af37]` or tokenised equivalent).
  - Body: off‑white / pale gray.
  - Card‑like containers with thin gold borders and separators.
  - Slightly less extreme type sizes, more conservative spacing.

- Images:
  - Limit to logo + 1–3 small photos total (mainly on Hostel Brikette page).
  - No carousels, heavy hero photography, or decorative stock images.

---

## 7. Performance strategy – “blazing fast” on **free** Cloudflare

Target: static, edge‑cached, minimal JS site, leveraging **only free features** of Cloudflare Pages & CDN.

### 7.1 Rendering strategy

- Use **static site generation** (SSG) for **all pages and locales**:
  - Pre‑render `/[lang]`, `/[lang]/products`, `/[lang]/real-estate`, `/[lang]/people` for `en`, `it`, `zh`.
  - No server data fetching at runtime; all content is static.
- Avoid Pages Functions/Workers for the main site; serve static HTML/JS/CSS only.
  - Static asset requests on Cloudflare Pages are free and unlimited.

This lets you deploy as a purely static Next.js export to **Cloudflare Pages** with:

- Unlimited static requests and bandwidth on the free plan.
- Up to 500 builds per month, 1 concurrent build, all free.

### 7.2 Cloudflare free‑tier optimisations

Use only free features:

- **Cloudflare Pages + CDN:**
  - Global edge distribution, HTTP/2/3, and TLS automatically included.
- **Caching:**
  - Leverage default static asset caching; configure long browser cache TTLs for CSS/JS/fonts via headers (Cloudflare supports this on the free plan).
  - Do not use paid features like Cache Reserve or Cloudflare Images.
- **Compression:**
  - Ensure Brotli compression is enabled (default for secure traffic via Cloudflare’s CDN on free plans).
- **DNS & SSL:**
  - Use Cloudflare DNS and Universal SSL (automatic HTTPS).

No Workers‑only paid add‑ons; if any Workers/Pages Functions are used (e.g. for a contact form later), they must stay within the free quota (100k requests/day).

### 7.3 App‑level performance practices

- **Minimal JS:**
  - Avoid heavy client‑side interactivity; stick to basic navigation and language switching.
  - Use React Server Components where possible (Next.js App Router default).
- **Font performance:**
  - Use only the two font families (Cinzel + Roboto).
  - Self‑host fonts and:
    - Subset to required weights (e.g. 400, 500, 700 for Roboto; 400/700 for Cinzel).
    - Use `font-display: swap` to avoid blocking rendering.
- **Images:**
  - Pre‑optimise images offline (WebP/AVIF where possible, reasonable dimensions).
  - Treat them as static assets on Cloudflare Pages (no Cloudflare Images, which is paid).
- **Code & CSS:**
  - Rely on Next.js / Tailwind build pipeline for:
    - Tree‑shaken bundles.
    - Purged CSS (only used classes).
    - Minified JS/HTML/CSS.
- **Navigation:**
  - Use Next’s `<Link>` prefetching for internal routes to warm up assets.
- **No tracking bloat:**
  - If analytics are needed, prefer Cloudflare’s free web analytics or a very lightweight script instead of heavy third‑party trackers.

---

## 8. Deliverables (before writing code)

Before implementation, produce:

1. **Route map & component tree** for:
   - `/[lang]`, `/[lang]/products`, `/[lang]/real-estate`, `/[lang]/people`.
2. **i18n key map** for `en.json`, `it.json`, `zh.json`, aligned to the exact card text and page structure.
3. **Typographic system spec**:
   - Mapping from the guidelines here to concrete Tailwind utility sets (for EN/IT and ZH themes separately).
4. **Performance checklist**:
   - How SSG is configured.
   - How the app is built & deployed to Cloudflare Pages (static only).
   - How fonts and images are hosted and cached.

Only once those are clear and agreed should you begin writing the Next.js / Tailwind code.
