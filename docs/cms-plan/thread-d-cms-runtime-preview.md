Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread D – CMS → shop runtime wiring & preview

This thread operationalises §4 of `docs/historical/cms-research.md`.*** End Patch ***!

It focuses on:

- Preview token generation and validation.
- Runtime preview endpoints (template app / Cloudflare).
- Navigation, header/footer composition, and shared layout.
- CMS-side preview UIs (configurator preview, page version preview, live preview).

---

## Context (from research)

- Template app:
  - Exposes a `GET /preview/:pageId` Cloudflare function that validates tokens, reads pages for the current shop, and returns JSON.
  - Renders `/preview/[pageId]` via a server route + `PreviewClient`, using the same `DynamicRenderer` as live pages.
- CMS:
  - Has a data-centric page version preview (`/preview/[token]`) that shows JSON and metadata for a saved version.
  - Has a configurator preview that renders local `components: PageComponent[]` + theme tokens directly via `blockRegistry` and UI primitives.
  - Has a `/cms/live` page that discovers running shop dev servers and links to them.
- There are multiple preview paths (Cloudflare, CMS local, live dev instances) with overlapping but not identical behaviour.

---

## Decisions / direction (to keep aligned)

- Runtime preview (via template app) should be the source of truth for “what the shop looks like”, using the same block registry and layout as live traffic.
- CMS-side previews should:
  - Either embed runtime preview where possible, or
  - Share the same rendering components/contract (for configurator/local preview).
- Preview tokens should be well-defined (HMAC-based) and reused across CMS + runtime where appropriate.

---

## Tasks

- [x] **PREVIEW-01 – Map and document all preview flows**
  - Scope:
    - Produce a concise doc/diagram of all current preview mechanisms and their contracts.
  - Implementation:
    - Add a short doc (e.g. extend `docs/upgrade-preview-republish.md` or add `docs/preview-flows.md`) that covers:
      - Template app `/preview/:pageId` function and `/preview/[pageId]` route.
      - CMS page version preview.
      - Configurator preview.
      - `/cms/live` dev-server discovery.
    - Include which components/renderers each path uses and which tokens/env vars they rely on.
    - Implemented as `docs/preview-flows.md`.
  - Definition of done:
    - New contributors can understand preview behaviour without reverse-engineering multiple apps.
  - Dependencies:
    - None (pure documentation).

- [x] **PREVIEW-02 – Unify preview token handling**
  - Scope:
    - Consolidate preview token generation/validation into a shared helper.
  - Implementation:
    - Identified current HMAC token logic (`PREVIEW_TOKEN_SECRET`, `UPGRADE_PREVIEW_TOKEN_SECRET`, etc.) across template app, tenant app, and upgrade tooling.
    - Implemented a shared `@platform-core/previewTokens` helper that generates and verifies base64url‑encoded HMAC tokens over `\`${shopId}:${pageId}\`` for both standard and upgrade preview tokens.
    - Updated Cloudflare preview routes (`packages/template-app/src/routes/preview/[pageId].ts`, `apps/cover-me-pretty/src/routes/preview/[pageId].ts`) and `/api/preview-token` routes to use the shared helper so CMS and runtime share a single implementation.
  - Definition of done:
    - A single implementation of preview token handling used across CMS and runtime.
  - Dependencies:
    - ARCH-01 (shared helper placement) and THREAD A decisions about shared libs.

- [x] **PREVIEW-03 – Runtime-rendered page version preview in CMS**
  - Scope:
    - Upgrade the CMS page-version preview from JSON-only to a runtime-rendered view.
  - Implementation:
    - In CMS:
      - For `/preview/[token]`, take the version payload’s `components` and feed it to a renderer that matches the template app’s `DynamicRenderer`.
      - Reuse the same block registry and layout primitives as the template app.
    - Optionally:
      - Embed the template app’s `/preview/:pageId` route in an iframe where appropriate.
  - Definition of done:
    - Users can see a faithful visual preview of a saved version within CMS.
  - Dependencies:
    - PB-03 (shared block registry).

- [x] **PREVIEW-04 – Align configurator preview with runtime contracts**
  - Scope:
    - Ensure configurator’s local preview uses the same block/props contracts as runtime preview.
  - Implementation:
    - `WizardPreview` (`apps/cms/src/app/cms/wizard/WizardPreview.tsx`) now renders configurator components via `DynamicRenderer` from `@ui/components/DynamicRenderer`, reusing the shared `blockRegistry` contracts used by runtime and PB preview.
    - The preview frame continues to derive its size from `devicePresets` (via `PreviewDeviceSelector`) and applies theme tokens from `usePreviewTokens` as inline CSS variables, matching runtime preview behaviour.
    - Token hover events (`THEME_TOKEN_HOVER_EVENT`) still outline matching elements in the preview so theme/editor interactions remain intact.
  - Definition of done:
    - A component that renders correctly in runtime preview also renders correctly in configurator preview.
  - Dependencies:
    - PB-03 (shared block registry).
    - PB-05 (metadata handling).

- [x] **PREVIEW-05 – Improve `/cms/live` dev-server discovery robustness**
  - Scope:
    - Harden the “live preview” dev-server discovery and surfacing.
  - Implementation:
    - `/cms/live` uses `listShops` (backed by `DATA_ROOT` via `@platform-core/dataRoot`) to discover shops and a local `resolveAppsRoot` helper in `apps/cms/src/app/cms/live/page.tsx` to locate `apps/shop-<id>` workspaces and their `package.json` files.
    - A `findPort(shop)` helper reads the app’s `dev` (or `start`) script, infers the port from the script command, and returns a structured `PortInfo` with error codes for missing apps (`app_not_found`), missing manifests (`package_json_missing`), and read/parse failures (`read_error`), which are mapped to human-readable messages via `cms.live.error.*` translations.
    - The server component builds hero stats and a per-shop list passed to `LivePreviewList`, which renders “Preview ready” vs “Unavailable” states with explanatory copy, and uses toasts for actionable feedback when a preview cannot be opened or when no shops/previews are configured.
  - Definition of done:
    - `/cms/live` gives clear feedback per shop (ready/unavailable) with actionable messages.
  - Dependencies:
    - ARCH-05 (tenancy and environment documentation) for consistent terminology.

---

## Dependencies & validation

- Depends on:
  - PB-03 for shared block registry.
  - ARCH-01 for shared helper placement and public surfaces.
- Validation:
  - Preview tokens work identically across CMS and runtime (smoke-tested via both preview UIs).
  - Page version preview and configurator preview visually match runtime pages for representative cases.
  - `/cms/live` reliably reports dev-server availability and errors.
