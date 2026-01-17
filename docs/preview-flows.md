Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

# Preview flows

This document maps the main preview mechanisms across the CMS and runtime apps so new contributors can see how they fit together without reverse‑engineering multiple code paths.

At a high level there are four primary preview surfaces:

- **Runtime preview** – template app preview of a single CMS page via `/preview/:pageId` and `/preview/[pageId]`.
- **Version preview (CMS)** – runtime‑rendered preview of a saved page version (plus JSON view) via `/cms/api/page-versions/preview/:token` and `/preview/[token]`.
- **Configurator preview** – in‑CMS live preview while configuring a shop, rendered entirely on the client from local state.
- **Live dev servers (`/cms/live`)** – discovery panel that links to running tenant apps for “true live” previews during development.
- **Stage-first Page Builder preview** – builder “Preview” action saves the latest draft and opens the runtime `/preview/[pageId]` URL with a token, preferring the Stage host when available.

### Overview table

| Flow                  | Primary endpoints                                      | Where it renders                                | Tokens / secrets                            | Notes                                                         |
| --------------------- | ------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Runtime preview       | `/preview/:pageId`, `/preview/[pageId]`               | Template app (`PreviewClient` + `DynamicRenderer`) | `PREVIEW_TOKEN_SECRET`, `UPGRADE_PREVIEW_TOKEN_SECRET`, `NEXT_PUBLIC_SHOP_ID` | Source of truth for runtime look‑and‑feel.                    |
| Version preview (CMS) | `/cms/api/page-versions/preview/:token`, `/preview/[token]` | CMS app (runtime‑rendered + JSON viewer page)   | Opaque link `token`, optional password hash | Shares specific saved versions with a faithful visual preview. |
| Configurator preview  | `WizardPreview` (local only)                           | CMS configurator / theme editor                 | `STORAGE_KEY`, `PREVIEW_TOKENS_KEY` in `localStorage` | Instant feedback while editing; no runtime calls.             |
| `/cms/live` panel     | `/cms/live`                                            | CMS “live” dashboard                             | `DATA_ROOT`, filesystem (`apps/shop-*`)     | Dev‑only shop runtime discovery and deep‑linking.             |
| Stage-first PB preview| `builder Preview` button → `/preview/[pageId]?token=…` | Runtime preview (Stage when available)           | `PREVIEW_TOKEN_SECRET`, deploy `previewUrl`/`url` | Saves draft, generates token, opens Stage URL if present.     |

### High-level data flow

```
CMS editor actions
  ├─ Save page version ───────────────► data/cms/page-versions.json
  │                                      ▲
  │                                /cms/api/page-versions/preview/:token
  │                                      │
  │                         /preview/[token] (JSON viewer in CMS)
  │
  ├─ Configure layout / theme ───► localStorage (components + tokens)
  │                                      │
  │                             WizardPreview (configurator UI)
  │
  └─ Open runtime preview ──────► /preview/:pageId (Cloudflare function)
                                         │
                                         ▼
                                Template app /preview/[pageId]
                                  (PreviewClient + DynamicRenderer)

/cms/live ──► scans DATA_ROOT + apps/shop-* ──► builds links to running shops
```

Upgrade/edit previews for tenant apps are covered in more detail in:

- [`upgrade-preview-republish.md`](./upgrade-preview-republish.md)
- [`edit-preview-republish.md`](./edit-preview-republish.md)

---

## Runtime preview – template app

**Goal:** Show how a CMS‑managed page would render in the shop runtime, using the same block registry and layout as live traffic.

- **Endpoints**
  - Cloudflare function: `GET /preview/:pageId?token=<hmac>&upgrade=<hmac?>`
    - Implemented in `apps/cover-me-pretty/src/routes/preview/[pageId].ts`.
  - Next.js route in the template app: `GET /preview/[pageId]`
    - Implemented in `apps/cover-me-pretty/src/app/preview/[pageId]/page.tsx` and `PreviewClient.tsx`.
  - CMS Page Builder “Preview” button:
    - Saves the current draft, resolves a preview URL preferring Stage (`readDeployInfo` previewUrl/url; fallback to `NEXT_PUBLIC_BASE_URL` or `http://localhost:3000`), and appends a preview token when secrets are present.
    - Opens the resolved `/preview/[pageId]` in a new tab and offers a copy-to-clipboard shortcut.

- **Data flow**
  - The Cloudflare function:
    - Reads `PREVIEW_TOKEN_SECRET` and `UPGRADE_PREVIEW_TOKEN_SECRET` from `@acme/config/env/core`.
    - Resolves the current shop id from `NEXT_PUBLIC_SHOP_ID || "default"`.
    - Validates either a `token` (normal preview) or `upgrade` (upgrade preview) query param using a base64url‑encoded HMAC SHA‑256 digest over `\`${shopId}:${pageId}\``.
    - Uses `getPages(shopId)` from `@acme/platform-core/repositories/pages/index.server` to load pages and returns the matching page JSON, or:
      - `401 Unauthorized` if the HMAC check fails.
      - `404 Not Found` if the page does not exist.
  - The Next.js route:
    - Forwards `token` / `upgrade` query params when calling `/preview/:pageId` with `cache: "no-store"`.
    - Parses the JSON with `pageSchema` (`@acme/types`), extracting `components`, optional `history.editor`, and a locale derived from `page.seo.title`.
    - Derives an initial device preset from `device` / `view` query params and passes it to `PreviewClient`.

- **Rendering**
  - `PreviewClient` is a client component that:
    - Tracks the selected device preset via `usePreviewDevice` and `DeviceSelector`.
    - Wraps the preview in a frame sized to the device’s width/height.
    - Renders the page via `DynamicRenderer` from `@ui/components/DynamicRenderer`, using the same block registry as live pages.

- **Tokens and env**
  - `PREVIEW_TOKEN_SECRET` / `UPGRADE_PREVIEW_TOKEN_SECRET`:
    - Per‑environment secrets used for HMAC validation.
    - If unset, preview routes will fail and should be treated as disabled.
  - `NEXT_PUBLIC_SHOP_ID`:
    - Identifies which shop’s pages to read when resolving `pageId`.
  - Deploy URLs:
    - Stage is preferred when `deploy.json` exposes `previewUrl`/`url` with `env: "stage"`.
    - Fallbacks: `NEXT_PUBLIC_BASE_URL` (if set) or `http://localhost:3000` during local dev.

---

## Version preview – CMS page versions

**Goal:** Share a stable link to a specific saved page version, including metadata, raw JSON, and a runtime‑rendered visual preview.

- **Endpoints**
  - API: `GET /cms/api/page-versions/preview/:token`
    - Implemented in `apps/cms/src/app/api/page-versions/preview/[token]/route.ts`.
  - Viewer UI: `GET /preview/[token]`
    - Implemented in `apps/cms/src/app/preview/[token]/page.tsx`.

- **Data flow**
  - Page versions and links are stored under `data/cms` (or `DATA_ROOT/../cms` in multi‑env setups):
    - `page-versions.json` – per‑shop, per‑page history, including component arrays and editor metadata.
    - `page-preview-links.json` – maps opaque `token` strings to `{ shop, pageId, versionId, passwordHash? }`.
  - `GET /cms/api/page-versions/preview/:token`:
    - Looks up the link by `token`; returns `404` if missing.
    - If `passwordHash` is present, requires a matching `pw` query param (hashed with SHA‑256) or returns `401`.
    - Reads the requested version from `page-versions.json` and returns:
      - `shop`, `pageId`, `versionId`, `label`, `timestamp`, `components`, and optional `editor`.
  - The viewer page `/preview/[token]`:
    - Is a client component that takes `params.token`.
    - Builds an API URL of the form `/cms/api/page-versions/preview/:token?pw=…` and fetches it with `cache: "no-store"`.
    - Shows an error message for 401/other failures, or:
      - Renders a visual preview of `components` using `DynamicRenderer` from `@ui/components/DynamicRenderer` with the shared block registry.
      - Renders basic metadata (shop, page, version, label, timestamp, component count).
      - Shows a JSON pretty‑printed view of the full payload, with a link to open the raw API response in a new tab.

- **Tokens**
  - Tokens are opaque link identifiers (not derived from IDs) with high entropy, generated by CMS tooling.
  - Each token maps to exactly one `(shop, pageId, versionId)`.
  - Tokens can be revoked by removing or flagging the entry in `page-preview-links.json`.
  - Password protection is optional and handled via `passwordHash` + `pw` query param.

---

## Configurator preview – in‑CMS live view

**Goal:** Give editors instant visual feedback while configuring a shop (theme, layout, blocks) without needing a running runtime app.

- **Components**
  - Main preview container: `WizardPreview` in `apps/cms/src/app/cms/wizard/WizardPreview.tsx`.
  - Used from configurator steps and theme editor, e.g. `StepSummary` and `ThemePreview`.

- **Data & state**
  - Wizard state is persisted in `localStorage` under a key exported from `useConfiguratorPersistence` (`STORAGE_KEY`).
  - `WizardPreview`:
    - Reads `components: PageComponent[]` from that key on mount.
    - Listens for `storage` and a custom `configurator:update` event to react to changes from other tabs or forms.
  - Theme tokens:
    - Stored in `localStorage` under `PREVIEW_TOKENS_KEY` in `previewTokens.ts`.
    - Updated via `savePreviewTokens`, which also dispatches a `previewTokens:update` event.
    - Loaded in the preview and applied as CSS custom properties on the preview container.

- **Rendering**
  - Uses `AppShell`, `Header`, `Footer`, and `SideNav` from the shared UI package to simulate the shop layout.
  - Renders blocks by:
    - Looking up `component.type` in `blockRegistry` from `@ui/components/cms/blocks`.
    - Mounting the corresponding React component, stripping metadata fields like `id` and `type`.
    - Handling rich‑text `Text` blocks via `DOMPurify` and `dangerouslySetInnerHTML`.
  - Device presets (`devicePresets`) control the preview viewport size; callers can pass a specific device or rely on the default.
  - Theme token hover events (`THEME_TOKEN_HOVER_EVENT`) highlight elements whose `data-token` matches the hovered token in the editor.

- **Characteristics**
  - Purely client‑side; no network calls or env secrets.
  - Optimised for fast iteration during configuration; it does **not** go through the runtime app or `/preview/:pageId`.

---

## `/cms/live` – dev‑server discovery

**Goal:** Help CMS users and developers open the right local runtime app for each shop during development.

- **Page & components**
  - Server page: `apps/cms/src/app/cms/live/page.tsx`.
  - Client list: `LivePreviewList` in the same folder.

- **Discovery flow**
  - The page:
    - Uses `listShops()` to enumerate shops by scanning `DATA_ROOT` (or the default `data` tree).
    - For each shop, resolves an app directory `apps/shop-<shop>` by walking up from `process.cwd()` until an `apps` folder is found.
    - Reads `apps/shop-<shop>/package.json` and inspects `scripts.dev` or `scripts.start` to find a `-p <port>` flag.
    - Records either:
      - A `port` (when found), or
      - An `errorCode` such as `app_not_found`, `package_json_missing`, or `read_error`, plus optional `errorDetail`.
  - `LivePreviewList`:
    - Renders a card per shop, with status tags based on whether a port was found.
    - Builds preview URLs of the form `http://localhost:<port>` and opens them via `window.open` when users click the “Open preview” action, with basic error/toast handling.

- **Characteristics**
  - Intended as a **dev‑only** convenience: it assumes local dev servers are running on the inferred ports.
  - In shared environments, the longer‑term plan is for `/cms/live` to get its shop list from a central `Shop` registry and attach “has local runtime” signals, rather than relying purely on filesystem discovery.

---

### Interpreting `/cms/live` states

- **Hero stats**
  - “Total shops” shows how many shops CMS knows about via `listShops()` (filesystem/`DATA_ROOT` in the current implementation).
  - “Previews ready” counts shops where a dev port was successfully inferred and a preview URL can be opened.
  - “Needs attention” counts shops with missing apps, missing `package.json`, or read/parse errors.

- **Per‑shop cards**
  - **Preview ready / “Open preview”**
    - Status tag: “Preview ready”.
    - Action: “Open preview” opens `http://localhost:<port>` in a new tab.
    - Interpretation: the app workspace exists, a dev/start script with a `-p <port>` flag was found, and that port is assumed to serve the shop runtime.
  - **Unavailable / “View details”**
    - Status tag: “Unavailable”.
    - Action: “View details” shows a toast with the reason:
      - “App workspace not found” → there is no `apps/shop-<shop>` folder.
      - “package.json not found” → the folder exists but has no manifest; scaffold or fix the workspace.
      - “Unable to read package metadata” → `package.json` could not be read/parsed; fix the file or permissions.
    - Interpretation: CMS can see the shop, but cannot confidently build a preview URL for it.

- **Empty states**
  - If there are **no shops**, the list section explains that you need to create a shop in the configurator to unlock live previews.
  - If there are shops but **no previews ready**, use the per‑shop messages to start the corresponding dev servers or repair their workspaces.

---

## How these previews fit together

- Runtime preview (`/preview/:pageId` + `/preview/[pageId]`) shows the page as rendered by the shop runtime, using the same `DynamicRenderer` and block mapping as live traffic.
- Version preview (`/cms/api/page-versions/preview/:token` + `/preview/[token]`) focuses on **specific saved versions**, exposing metadata, JSON, and a runtime‑rendered view using the shared block registry.
- Configurator preview (`WizardPreview`) gives instant feedback while editing layout and theme, driven by CMS state and theme tokens stored in the browser.
- `/cms/live` links all of this back to actual running tenant apps, making it easy to jump from CMS to a live dev instance for a given shop.

### Token and key overview

| Name / field                 | Used by / surface                               | Type                      | Storage / source                                | Security properties / notes                                                                 |
| --------------------------- | ----------------------------------------------- | ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `token` (runtime preview)   | `/preview/:pageId` HMAC query param             | HMAC‑SHA256 digest        | Derived from `PREVIEW_TOKEN_SECRET` + page info | Read‑only JSON access; scoped to env + shop + page; rotate secret to revoke all tokens.     |
| `upgrade` (runtime preview) | `/preview/:pageId` HMAC query param             | HMAC‑SHA256 digest        | Derived from `UPGRADE_PREVIEW_TOKEN_SECRET`     | Same model as `token` but for upgrade previews; kill‑switch via secret rotation.            |
| `PREVIEW_TOKEN_SECRET`      | Runtime preview function                        | Env var (secret)          | `@acme/config/env/core`                         | Must be per‑environment; never checked into source; required for normal runtime previews.   |
| `UPGRADE_PREVIEW_TOKEN_SECRET` | Runtime preview + upgrade tooling            | Env var (secret)          | `@acme/config/env/core`                         | Must be per‑environment; required for upgrade previews and related tooling.                 |
| `token` (version preview)   | `/cms/api/page-versions/preview/:token` path    | Opaque random link token  | `page-preview-links.json`                       | High‑entropy, not derived from IDs; can be revoked per‑link; safe to share with stakeholders. |
| `pw`                        | Version preview password query param            | Plain string → SHA‑256    | Compared against `passwordHash` in links store  | Optional extra protection; only enables reading preview JSON; keep out of logs where possible. |
| `passwordHash`              | Version preview link metadata                   | SHA‑256 hash of password  | `page-preview-links.json`                       | Treated as a secret hash; do not reuse end‑user account passwords here.                     |
| `NEXT_PUBLIC_SHOP_ID`       | Runtime preview + runtime apps                  | Public env var            | Template/tenant app env                         | Not secret; identifies which shop’s pages to read; used as part of preview token payload.   |
| `STORAGE_KEY`               | Configurator preview (`WizardPreview`)          | LocalStorage key          | Browser `localStorage`                          | Not secret; holds draft components; do not store auth/session data under this key.          |
| `PREVIEW_TOKENS_KEY`        | Theme preview tokens in configurator            | LocalStorage key          | Browser `localStorage`                          | Not secret; holds theme token values for preview; avoid leaking real secrets into tokens.   |

For more detail on token formats, expiry, and security considerations, see the preview sections in `docs/historical/cms-research.md`.
