Type: Plan
Status: Active
Domain: Marketing
Last-reviewed: 2025-12-02
Relates-to charter: docs/commerce-charter.md

# Campaign Marketing Components – Testing Notes

## Active tasks

- **MKT-01 — Maintain campaign marketing test coverage**
  - Status: ☐
  - Scope:
    - Keep the test checklist below aligned with the current implementation of campaign marketing components and fl<canvas style="display: block; width: 1024px; height: 150px; touch-action: auto;" data-engine="three.js r182" width="2048" height="300"></canvas>ows.
  - Dependencies:
    - Commerce charter (for orders/returns alignment) and UI component contracts in `packages/ui`.
  - Definition of done:
    - For any significant changes to campaign marketing flows, this plan and associated test files are updated to match.

## Completed / historical

## Testing Checklist

- **Workspace setup**
  - Install dependencies with `pnpm install` and build packages via `pnpm -r build` before running targeted tests.【F:AGENTS.md†L3-L9】
- **UI package (@acme/ui)**
  - Primary test runner: Jest with React Testing Library, executed through `pnpm exec jest` as wired in the package’s `test` script.【F:packages/ui/package.json†L18-L22】
  - Component tests reside under `src/components/**/__tests__` and use the `*.test.tsx` suffix (for example, existing CMS suites under `components/cms/__tests__`).【56cef8†L1-L2】
- **CMS app (@apps/cms)**
  - Run suites with `pnpm exec jest --config ./jest.config.cjs` via the app-level `test` script.【F:apps/cms/package.json†L4-L10】
  - Jest loads environment helpers (`jest.env.ts`, `jest.setup.ts`) and applies additional setup (`jest.setup.after.ts`, `jest.setup.polyfills.ts`, MSW server). Core React/Next shims are centralized in `test/polyfills/react-compat.ts` (React `act`, internal aliasing, `MessageChannel`, `Response.json`) and DOM shims live in `test/polyfills/dom-compat.ts` (encoders, `File`, object URLs, `scrollIntoView`, pointer capture). Prefer these shared polyfills over per-suite copies.【F:apps/cms/jest.config.cjs†L18-L29】【F:apps/cms/jest.setup.after.ts†L6-L153】【F:apps/cms/**tests**/msw/server.ts†L1-L10】【F:test/polyfills/react-compat.ts†L1-L80】【F:test/polyfills/dom-compat.ts†L1-L60】
  - Existing page suites (e.g., `campaigns/page.test.tsx`) assert UI feedback with Testing Library utilities—follow the same style for new tests.【F:apps/cms/src/app/cms/campaigns/page.test.tsx†L1-L36】

## Component Inventory

### `CampaignForm`

- **Path:** `packages/ui/src/components/cms/marketing/campaign/CampaignForm.tsx`.【F:packages/ui/src/components/cms/marketing/campaign/CampaignForm.tsx†L1-L200】
- **Public props:** accepts defaults, optional sections, server `validationErrors`, lifecycle callbacks (`onSubmit`, `onStatusChange`, `onPreviewChange`), UI messaging overrides, and secondary/back actions.【F:packages/ui/src/components/cms/marketing/campaign/CampaignForm.tsx†L44-L200】
- **Key behaviors:**
  - Validates required fields per visible sections and enforces numeric/date rules before submission.【F:packages/ui/src/components/cms/marketing/campaign/CampaignForm.tsx†L62-L100】
  - Emits status transitions and toast feedback on validation success/failure or async submission outcomes.【F:packages/ui/src/components/cms/marketing/campaign/CampaignForm.tsx†L145-L186】
  - Streams preview payloads through `onPreviewChange` whenever form state mutates.【F:packages/ui/src/components/cms/marketing/campaign/CampaignForm.tsx†L132-L135】
- **Helpers:** `defaultCampaignValues`, enumerated section field map, and `getCampaignPreview` from `types.ts` to seed form state and derive preview data.【F:packages/ui/src/components/cms/marketing/campaign/types.ts†L20-L80】

### `CampaignWizard`

- **Path:** `packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx`.【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L1-L200】
- **Public props:** optional initial values, async `onSubmit`, validation error passthrough, `onPreviewChange`, `finishLabel`, customizable messaging, styling hook.【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L30-L77】
- **Key behaviors:**
  - Manages ordered steps (`plan → audience → schedule → review`) with section-specific form rendering and guarded navigation.【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L40-L118】【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L158-L199】
  - Regenerates preview data and bubbles updates upward when form values change.【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L78-L123】
  - Finalizes with toast messaging that reflects submission success, completion without persistence, or error scenarios.【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L125-L155】
- **Helpers:** consumes `CampaignForm`, `CampaignPreviewPanel`, `CampaignSummaryCard`, and shared `StepIndicator` utilities for layout and progress tracking.【F:packages/ui/src/components/cms/marketing/campaign/CampaignWizard.tsx†L7-L199】

### `CampaignPreviewPanel`

- **Path:** `packages/ui/src/components/cms/marketing/campaign/CampaignPreviewPanel.tsx`.【F:packages/ui/src/components/cms/marketing/campaign/CampaignPreviewPanel.tsx†L1-L76】
- **Public props:** accepts preview `data`, optional `className`, and `actions` slot passed through to the wrapped `PreviewPanel`.【F:packages/ui/src/components/cms/marketing/campaign/CampaignPreviewPanel.tsx†L6-L24】
- **Key behaviors:** renders formatted headline, objective tag, schedule/budget tiles, channels, audience summary, and KPI snippet via the shared preview shell.【F:packages/ui/src/components/cms/marketing/campaign/CampaignPreviewPanel.tsx†L24-L70】
- **Helpers:** leverages generic `PreviewPanel` to keep summary rendering composable.【F:packages/ui/src/components/cms/marketing/shared/PreviewPanel.tsx†L1-L34】

## UI Component Test Plan

- **CampaignForm**
  - Missing required inputs trigger validation status, toast, and `aria-invalid` flags; assert `onStatusChange` sequence and toast copy.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignForm.test.tsx†L8-L37】
  - Successful submission forwards sanitized values, reports `submitting → success`, and surfaces the success toast message.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignForm.test.tsx†L39-L66】
  - Server `validationErrors` render immediately and clear on field edits to confirm merge logic.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignForm.test.tsx†L68-L83】
  - Preview updates propagate as users edit inputs, validating real-time preview hooks.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignForm.test.tsx†L85-L103】
- **CampaignWizard**
  - Step progression: continue through plan → audience → schedule, enter review, and ensure final submit passes accumulated values and success toast.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignWizard.test.tsx†L11-L42】
  - Back navigation restores earlier sections, confirming guarded step selection.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignWizard.test.tsx†L44-L55】
  - Preview callback reflects edits and submission failures surface error toast messaging.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignWizard.test.tsx†L57-L85】
- **CampaignPreviewPanel**
  - Snapshot summary assertions cover headline, schedule, budget, channels, audience, KPI, plus optional action slot rendering.【F:packages/ui/src/components/cms/marketing/campaign/**tests**/CampaignPreviewPanel.test.tsx†L1-L38】

## CMS Usage Check

A repository search shows no current imports of `@ui/components/cms/marketing/campaign/*` inside `apps/cms`, so no CMS pages consume these components yet and no additional RTL suites were updated for them in this cycle.【559147†L1-L2】【7102f1†L1-L1】 Existing marketing pages continue to rely on legacy composer/sender components, whose tests already verify toast feedback.【F:apps/cms/src/app/cms/campaigns/page.test.tsx†L1-L36】

## Playwright Status

`apps/cms` does not provide a Playwright configuration or E2E spec directory—`find` searches return no configuration files—so new scenarios were not authored. Establishing E2E coverage would require introducing a `playwright.config` plus scaffolding for fixtures and selectors.【041418†L1-L2】 Alternative end-to-end coverage today relies on Cypress flows defined at the workspace root (`pnpm run e2e`).
