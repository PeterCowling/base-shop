---
Type: Reference
Status: Canonical
Domain: CMS
---

# Shop Owner Workflow — Plan → Build → Launch

**Role split:** shop owners compose from the published template library and do not create/edit templates. Template authors work in fixture shops/Storybook; see `docs/template-builder-workflow.md`. Owners stay inside CMS/Configurator/Page Builder and Launch only.

Audience: shop owners assembling a storefront in the CMS and taking it live. Keep steps linear, data-backed, and reversible. Pair this with the Configurator/Launch panels for readiness signals. Incorporates feedback to emphasize identity, templates, staging gates, and compliance.

## 1) Prepare the workspace
- Sign in to the CMS dashboard. Ensure you see the Configurator and Page Builder entries.
- Create/select the shop context and set its identity up-front: shop name/branding and primary domain/URL so previews feel real immediately.
- Set primary locale, currency, and **timezone** in Settings to keep inventory, sales, and reporting consistent across regions.
- Verify CSRF/auth cookies are present (login flow handles this) so launch and smoke actions succeed.

## 2) Configure the shop (foundation)
- Open `/cms/configurator` and work through required steps: shop basics, payments/billing, shipping/tax, checkout page, products/inventory, navigation.
- Payments/Shipping: use guided integrations where available (e.g., Connect Stripe → OAuth → Success) to avoid manual key copy/paste.
- Clarify checkout: configure checkout settings (fields/privacy/tax/address) here; checkout **layout** is composed later in the Page Builder.
- Use the Launch panel tooltip and missing-step banner for authoritative blockers. Clicking the CTA jumps to the first missing step and clears the warning.
- Optional growth tracks (theme, tokens, reach/social, import data) can be skipped initially; server checks will not block launch on these.

## 3) Build pages (composition)
- Start from a **template library** (e.g., PLP/PDP/Home presets) instead of a blank slate to reduce setup time.
- Open the Page Builder for the shop (e.g., `/cms/shop/{id}/pages/{pageId}/edit`). The builder should load the block registry for the active theme.
- Add sections from the Palette, reorder via drag-and-drop, and edit styles/content inline. Use device/locale toggles to preview variants.
- Draft vs Published: Draft/Published chips show current state; “Unpublished changes” appears after editing a published page. The Preview button saves the latest draft and opens the runtime `/preview/[pageId]` with a token, preferring the Stage host when available (fallback to configured base URL or local template app). Publish pushes to live/stage. Undo/redo is available for local edits; published state is stored via the CMS backend.
- For multi-page flows (home, product, checkout, navigation), repeat: select page → compose → save → publish.

## 4) Theming and assets
- Choose a theme in Configurator (or Tokens step) to set design defaults. Fine-tune tokens (colors, typography, spacing) in the Theme/Design panels.
- Upload media in the Media Library; reference assets from blocks. Ensure social/OG images are set in SEO settings for share previews. Set favicon and default social/OG image for consistent link previews.

## 5) Launch readiness
- Return to the Configurator dashboard. The Launch checklist reflects server-side checks (not just local state).
- If the Launch panel shows missing required steps, use the CTA to jump/fix. The banner clears automatically after fixes are saved.
- Compliance: verify legal pages (TOS, Privacy, Refund) are linked in footer/checkout and SEO settings.
- Review environment readiness: smoke summary per env (stage/prod) and rerun smoke tests from the Launch panel if needed.
- Stage-first rule: the first production launch is blocked until you deploy to Stage, get a passing (or explicitly skipped) Stage smoke result, and tick the QA acknowledgement (“I reviewed staging”) for that Stage deploy.
- Staging gate: deploy to Stage first; require a passing staging smoke test and manual click-through of Home → PLP → PDP → Cart → Checkout before promoting to Prod.

## 6) Launch
- Choose target environment in the Launch panel. For first-time launch, enforce Stage before Prod.
- Click “Launch.” The system streams progress for create → init → deploy → tests → seed. Blocking config issues stop the stream with actionable errors and links to fix.
- If smoke tests fail, use “Re-run smoke tests” in the Launch panel after fixes. Deploys are queued with retries; failures surface in the stream and the smoke summary.

## 7) Post-launch hygiene
- Verify live pages (home/PLP/PDP/checkout) render correctly with real data. Check navigation links and SEO previews.
- Monitor telemetry and smoke status; rerun smoke after significant changes.
- Keep the Configurator in sync: mark steps complete when done to retain an accurate launch readiness view.

## What “world-class” looks like (targets)
- Single, embedded Page Builder package (`@acme/page-builder-ui`) with documented registry API; no deep imports.
- Storybook scenarios for page composition (add, style, reorder, publish) using real registries and data.
- E2E tests that cover authoring → publish → launch → smoke in one flow.
- Async deploy queue with persisted jobs and retry/backoff; smoke controls with artifact links.
- Compliance checks for legal pages and staged approvals before production.

## Action backlog (owner experience)
- Make draft vs published state explicit in Page Builder chrome and preview (PB-N11) with stage-first cues.
- Split checkout layout editing out of the Configurator step and show clear checkout status/publish badges (PB-N12).
- Add richer, high-fidelity template/preset gallery in CMS so owners can choose confidently without authoring templates.
- Introduce light “quests”/celebrations for core edits (add hero, add products, publish) to make the flow feel rewarding without gamification.
