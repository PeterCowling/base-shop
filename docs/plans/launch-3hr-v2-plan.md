---
Type: Plan
Status: Active
Domain: Launch
Created: 2026-01-23
Created-by: Claude Opus 4.5
Last-reviewed: 2026-01-23
Relates-to charter: none
Predecessor: docs/plans/archive/launch-shop-pipeline-plan.md
---

# Plan: Rapid Shop Launch (v2)


## Active tasks

No active tasks at this time.

## Objectives

1. **45-minute target** — a trained operator launches a Basic tier shop in ≤45 minutes of operator-active time (90-minute ceiling with recovery). See [time budget](launch-time-budget.md) for metric definition.
2. **UI-driven** — the entire flow lives in the CMS. No terminal commands, no config file editing.
3. **Three stages** — Configure → Review → Launch. No ceremony between stages.
4. **Template-default experience** — each wizard step pre-selects the approved default. The operator confirms or overrides. Most steps are one-click confirmations.
5. **Content derivation** — pages are generated automatically from the operator's selections. No required content authoring; bounded inline edits (≤10 text fields) allowed during Review.
6. **Automated gates** — six go-live gates run without operator action. Failures produce actionable messages that link back to the relevant wizard step.
7. **No oversell** — inventory holds at checkout + OOS blocking, verified by gates before go-live.
8. **Auditable output** — every launch produces a timing report with per-stage operator-active time and gate results.

---

## Approach

The predecessor plan (v1) built primitives bottom-up. This plan delivers an integrated UI experience top-down: define the three-stage operator flow in the CMS, then wire it to existing infrastructure.

**Core insight**: The operator's job is to *confirm* a set of pre-selected defaults and upload 3 brand files. The system does everything else. The 45-minute target is achievable because the operator is not creating — they are approving.

---

## Roles

Two roles participate in the launch lifecycle. Their responsibilities are strictly separated:

| Role | Identity | Launch phase | Access |
|---|---|---|---|
| **Administrator** | Platform operator / DevOps | Pre-launch: provisions infrastructure, configures integrations, invites owner | Full CMS (all shops) |
| **Shop Owner** | Merchant / store operator | Pre-launch: adds products and brand. Launch: runs the rapid-launch wizard | Single-shop CMS (their shop only) |

**Access rule**: Administrators can perform shop owner tasks (e.g., add products on behalf of an owner). Shop owners cannot perform administrator tasks (e.g., configure Stripe, manage DNS).

**Handoff**: The administrator completes infrastructure prerequisites, then invites the shop owner via the existing RBAC system. The owner sees a "Launch Shop" card only after admin prerequisites pass (see Task 5.4).

**Who runs the wizard**: The shop owner (or an administrator acting on their behalf). The 45-minute SLA measures the wizard operator's active time, regardless of which role they hold.

---

## The Three-Stage Flow

See [launch-time-budget.md](launch-time-budget.md) for detailed time allocations, acceptance criteria, and SLA boundary rules.

```
  Stage 1: CONFIGURE (15 min)        Stage 2: REVIEW (15 min)        Stage 3: LAUNCH (10 min)
 ┌──────────────────────────┐     ┌───────────────────────────┐    ┌──────────────────────────┐
 │ Wizard steps:             │     │ Auto-generated previews:   │    │ Automated sequence:       │
 │  1. Shop identity         │     │  • Home page               │    │  • Deploy to preview      │
 │  2. Theme + brand kit     │ ──▶ │  • Product pages (1–5)     │ ──▶│  • 6 go-live gates        │
 │  3. Products (≤5)         │     │  • Category page           │    │  • Sign-off checklist     │
 │  4. Commerce templates    │     │  • Content pages (3)       │    │  • Deploy to production   │
 │  5. Compliance + SEO      │     │  • Legal pages (3)         │    │  • Acceptance test        │
 └──────────────────────────┘     │  • FAQ + Shipping/Returns  │    └──────────────────────────┘
                                   │  • Navigation + Checkout   │
                                   └───────────────────────────┘
         ▲                                    │
         └────────────────────────────────────┘
              (back navigation if issues found)
```

---

## Gap Analysis (Based on Codebase Audit)

### What Already Exists

| Capability | Location | Status |
|---|---|---|
| CMS configurator (13 steps, 4 tracks, context state, persistence) | `apps/cms/src/app/cms/configurator/` | Working |
| Theme registry (10 themes, auto-discovered, tokens + CSS) | `packages/themes/` + `platform-core/src/themeRegistry/` | Working (rapid launch surfaces curated 1–2 subset) |
| Page templates (16 templates, 7 content page types + variants) | `packages/templates/src/corePageTemplates.ts` | Working (legal pages use bundle content in standard layout, not separate templates) |
| Legal/compliance templates (6 types, director-approved) | `packages/templates/src/corePageTemplates.ts` (legal group) | Working |
| Provider templates (3 payment, 4 shipping, 2 tax, Zod-validated) | `packages/templates/src/providerTemplates.ts` | Working (rapid launch surfaces 1–2 per type) |
| Launch pipeline (preflight, scaffold, CI, deploy, smoke, report) | `scripts/src/launchShop.ts` + `scripts/src/launch-shop/` | Working |
| Go-live gates (6 gates, structured output) | `scripts/src/launch-shop/goLiveGates.ts` | Working |
| Central inventory (CRUD, routing, allocation modes, sync) | `packages/platform-core/src/centralInventory/` | Working |
| Inventory holds (create/extend/commit/release, TTL, reaping) | `packages/platform-core/src/inventoryHolds.ts` | Working |
| Launch reports (per-step timing, deploy URLs, smoke results) | `scripts/src/launch-shop/steps/report.ts` | Working |
| Server-side config checks (8 required + 4 optional) | `packages/platform-core/src/configurator.ts` | Working |
| Launch API route (streaming progress, phases) | `apps/cms/src/app/api/launch-shop/route.ts` | Working |
| PageBuilder integration (home, shop, product, checkout, layout) | Configurator steps + `packages/cms-ui/src/page-builder/` | Working |

### What Doesn't Exist (Gaps)

| Gap | Why it's critical | Effort estimate |
|---|---|---|
| **Content derivation engine** | No code exists to auto-populate page templates from product/shop data. The only related code is AI SEO metadata generation (unrelated). This is the core innovation of the 45-min target. | Large |
| **Product selection from central inventory** | Existing wizard has no step for selecting products from central catalog. It has inventory *settings* (StepInventory.tsx) and data *import* (StepImportData.tsx), but not "pick products from central catalog." | Medium |
| **Review stage UI** | Wizard currently goes directly from configuration to launch. No intermediate review of generated pages. | Medium |
| **Default pre-selection** | Existing wizard requires operator to actively fill every field. No defaults pre-selected. Steps are designed for authoring, not confirming. | Medium |
| **Brand kit auto-derivation** | Logo upload exists (StepShopDetails.tsx) but only stores the uploaded file. No auto-generation of favicon sizes, OG image, or header/footer placement. | Small |
| **Preflight as wizard entry gate** | Existing preflight runs at launch time (inside the pipeline). Plan needs it at wizard open time, blocking step 1 until prerequisites pass. | Small |
| **SLA timing instrumentation** | Existing launch report has per-step timing but not per-stage (Configure/Review/Launch), idle detection, or operator-active vs elapsed separation. | Small |
| **Gate results rendered in CMS UI** | Gates run in the CLI pipeline and produce JSON. CMS launch UI shows streaming progress but doesn't render structured gate results with fix links. | Small |
| **Email sender verification UI** | No CMS screen for configuring + verifying sender domain (SPF/DKIM). Only basic SMTP env vars exist (`StepEnvVars`). Needed as a preflight fix-link target. | Small |
| **Prerequisite fix-link routing** | Preflight "Fix" links must navigate to the correct setup screen for each failing prerequisite. Existing configurator steps need standalone rendering outside the wizard context. | Small |
| **Admin/owner handoff flow** | No mechanism for an admin to provision a shop, complete platform prerequisites, and then invite the owner with launch-ready visibility. RBAC exists but "Launch Shop" card gating is new. | Small |

### What Exists But Needs Adaptation

| Component | Current state | Required change |
|---|---|---|
| Configurator wizard (13 steps) | Designed for comprehensive shop setup (all tracks) | Subset into 5 focused steps for Basic tier rapid launch |
| ConfiguratorContext + wizard schema | ~40 fields, Zod-validated, persisted | Extend with product IDs, legal bundle ID; add defaults logic |
| `useLaunchShop` hook | Calls `/api/launch-shop` with streaming | Add gate result rendering, timing instrumentation, stage awareness |
| Launch API route | Streams phases: create → init → deploy → tests | Add content derivation step; add gate result structured response |
| Preflight checks (`configurator.ts`) | 8 required checks run server-side at launch time | Move to run at wizard open; add central inventory + domain checks |
| `createShop` / `initShop` | Creates shop from ConfiguratorState | Accept derived pages from content derivation (not just template IDs) |
| Configurator steps (StepHosting, StepPaymentProvider, StepShipping) | Render inside wizard context only | Wrap with standalone layout for use as preflight fix-link targets |
| Inventory UI (`/cms/shop/[shop]/data/inventory`) | CRUD table for inventory items | Add "Add product" guided prompt for empty state; validate required fields for launch-readiness |

---

## Derived Content Persistence

When the content derivation engine produces pages, they must be stored durably for the launched shop to serve.

### Storage model

Derived pages are stored as **rendered component trees at launch time**. They are not stored as template references that re-render later.

| Artifact | Storage location | Format |
|---|---|---|
| Page component trees | `data/shops/<shopId>/pages/<pageType>.json` | Serialized `PageComponent[]` (same schema as page-builder state) |
| Navigation | `data/shops/<shopId>/navigation.json` | `{ header: NavItem[], footer: NavItem[] }` |
| Brand kit files | `data/shops/<shopId>/assets/` | Uploaded files (logo, favicon, og-image) |
| Launch config snapshot | `data/shops/<shopId>/launch-config.json` | Frozen `DeriveContentInput` at time of launch |
| Derivation warnings | `data/shops/<shopId>/launches/<launchId>.json` | Part of launch report |

### Versioning and migration

- **Immutable at launch**: derived pages are a point-in-time snapshot. Template updates do not retroactively affect launched shops.
- **Re-derivation**: if the operator re-launches (e.g., to update products), content is re-derived fresh. Previous version is archived in `launches/` history.
- **Manual edits post-launch**: after a shop is live, the operator can edit pages via the full page-builder. These edits are independent of the derivation — they modify the stored component tree directly.
- **No automatic re-rendering**: if `corePageTemplates` changes, existing shops are unaffected. Only new launches or explicit re-derivations pick up new templates.

### Compatibility

The component tree schema is the same as the page-builder's existing state format (defined in `packages/cms-ui/src/page-builder/state/component.schema.ts`). This means:
- Derived pages are immediately editable in the page-builder after launch
- No schema translation needed
- Standard page-builder versioning/revision history applies after launch

---

## Recovery and Idempotency

### Re-launch semantics

If a gate fails and the operator fixes the issue (via wizard or infrastructure), clicking "Re-launch" executes:

| Step | Reused? | Rationale |
|---|---|---|
| Content derivation | Re-runs if input hash changed; cached if unchanged | Ensures derived content reflects fixes |
| Brand kit upload | Reused (files already in asset storage) | Idempotent |
| Scaffold | Reused (shop directory exists) | Idempotent with `--force` |
| Deploy to preview | Re-runs (new build) | Required to pick up any changes |
| Gates | Re-runs all 6 | Gates are stateless checks against the live preview |
| Production deploy | New deployment | Clean deployment |
| DNS/routing changes | Idempotent (upsert) | Safe to repeat |
| Inventory routing | Idempotent (upsert `InventoryRouting` records) | Safe to repeat |

**Derivation cache key**: `SHA-256(JSON.stringify(DeriveContentInput))`. The input includes all wizard state that affects derivation output: shop details, theme ID + color, brand kit URLs, product IDs/data, template IDs, legal bundle ID, and SEO text. If any field changes (including going back to a wizard step and changing a value), the hash changes and derivation re-runs. Navigating back and making no changes does not invalidate the cache.

### Side effect safety

- **Stripe objects**: checkout sessions are ephemeral (test mode); no cleanup needed
- **Inventory holds**: TTL-based; expired holds auto-release. Active holds from previous attempt are released before re-launch
- **Asset uploads**: overwrite-safe (same paths)
- **DNS records**: upsert semantics (Cloudflare API)

---

## Concrete Tasks

### Phase 1: Content Derivation Engine (Critical Path)

This is the only piece that doesn't exist at all. Everything else is adaptation of working code.

**Location**: `packages/platform-core/src/launch/contentDerivation.ts`

**Task 1.1: Define content derivation interface and types**

Create `packages/platform-core/src/launch/types.ts`:
```typescript
type PageType =
  | 'home' | 'category' | 'product'
  | 'about' | 'contact' | 'faq' | 'shipping-returns'
  | 'terms' | 'privacy' | 'accessibility';

interface DeriveContentInput {
  shop: { name: string; slug: string; locale: string; currency: string; description?: string; contactEmail: string; supportEmail: string; returnsAddress?: string };
  theme: { id: string; colorOverride?: string };
  brandKit: { logoUrl: string; faviconUrl: string; socialImageUrl: string };
  products: Array<{ id: string; name: string; description: string; images: string[]; price: number; currency: string; variants: Variant[]; sizes?: string[]; materials?: string[]; weight?: number; dimensions?: Dimensions }>;
  commerce: { paymentTemplateId: string; shippingTemplateId: string; vatTemplateId: string };
  compliance: { legalBundleId: string; consentTemplateId: string };
  seo: { title: string; description: string };
}

interface DerivedPage {
  type: PageType;
  slug: string;
  templateId: string;
  components: PageComponent[];
  seo: { title: string; description: string };  // per-page SEO metadata
  warnings: string[];
}

interface DeriveContentOutput {
  pages: DerivedPage[];  // 9 fixed pages + 1–5 product pages = 10–14 total
  navigation: { header: NavItem[]; footer: NavItem[] };
  derivationDurationMs: number;
  warningCount: number;
}
```

The `PageComponent[]` schema matches `packages/cms-ui/src/page-builder/state/component.schema.ts` — derived pages are immediately compatible with the page-builder for post-launch editing.

**Task 1.2: Implement per-page derivation functions**

For each page type, write a derivation function that:
1. Loads the corresponding template from `corePageTemplates` (e.g., `core.page.home.default`)
2. Clones the template's `components[]` array
3. Fills component props with data from the input
4. Derives per-page SEO metadata (title + description)

**Per-page SEO derivation rules:**
- Home: `"{shopName} | Online Shop"` / shop description or generic
- Category: `"Shop All | {shopName}"` / `"Browse our collection of {productCount} products"`
- Product: `"{productName} | {shopName}"` / first 160 chars of product description
- About: `"About {shopName}"` / shop description
- Contact: `"Contact {shopName}"` / `"Get in touch with {shopName}"`
- FAQ: `"FAQ | {shopName}"` / `"Frequently asked questions about {shopName}"`
- Shipping/Returns: `"Shipping & Returns | {shopName}"` / template-derived summary
- Legal pages: `"{pageTitle} | {shopName}"` / generic per type

The wizard's SEO input (`DeriveContentInput.seo`) provides a global fallback title/description used only if per-page derivation produces empty values.

**Product page derivation is a factory (not a single function):**
```typescript
// product.ts exports a factory that produces 1–5 pages
export function deriveProductPages(
  products: DeriveContentInput['products'],
  template: PageTemplate,
  shopName: string
): DerivedPage[] {
  return products.map(product => ({
    type: 'product',
    slug: `/shop/${slugify(product.name)}`,
    templateId: template.id,
    components: fillProductTemplate(template.components, product),
    seo: { title: `${product.name} | ${shopName}`, description: product.description.slice(0, 160) },
    warnings: validateProductPage(product),
  }));
}
```

All other derivation functions produce exactly 1 page each.

Files to create:
- `packages/platform-core/src/launch/derivation/home.ts` — 1 page
- `packages/platform-core/src/launch/derivation/category.ts` — 1 page
- `packages/platform-core/src/launch/derivation/product.ts` — 1–5 pages (factory)
- `packages/platform-core/src/launch/derivation/about.ts` — 1 page
- `packages/platform-core/src/launch/derivation/contact.ts` — 1 page
- `packages/platform-core/src/launch/derivation/faq.ts` — 1 page
- `packages/platform-core/src/launch/derivation/shippingReturns.ts` — 1 page
- `packages/platform-core/src/launch/derivation/legal.ts` — 3 pages (terms, privacy, accessibility — content from legal bundle)
- `packages/platform-core/src/launch/derivation/index.ts` — orchestrator, produces 10–14 pages total

**Task 1.2a: Define legal bundle format**

A legal bundle is a named set of legal documents stored in `corePageTemplates.ts` (legal group). Each bundle contains entries for each legal page type:

```typescript
interface LegalBundle {
  id: string;
  name: string;
  approved: boolean;  // legal team sign-off
  rapidLaunch?: boolean;
  documents: {
    terms: LegalDocument;
    privacy: LegalDocument;
    accessibility: LegalDocument;
    returns: LegalDocument;  // used in Shipping/Returns page
    consent: ConsentConfig;  // used for consent banner
    vat: VatConfig;          // used in checkout
  };
}

interface LegalDocument {
  title: string;
  sections: Array<{ heading: string; body: string }>;  // structured markdown content
}
```

The `legal.ts` derivation function converts `LegalDocument.sections` into `PageComponent[]` using a standard text-section layout: each section becomes a `Section` component with a `Heading` + `RichText` child. The content is verbatim (no template filling or substitution needed).

**Task 1.3: Implement navigation derivation**

Auto-generate header and footer nav from the generated page set:
- Header: Home, Shop (`/shop`), About (`/about`), Contact (`/contact`)
- Footer: Shipping & Returns (`/shipping-returns`), FAQ (`/faq`), Terms (`/terms`), Privacy (`/privacy`), Accessibility (`/accessibility`)

Navigation is deterministic (not configurable in Basic tier). The mapping is hardcoded from `PageType → NavItem`.

**Task 1.4: Implement fallback rules**

For each derivation function, handle missing optional data:
- Missing sizes → omit size chart section in FAQ
- Missing materials → omit materials section in FAQ
- Missing shop description → use template default copy with `{{shopName}}` substituted
- Missing product variants → show product with no variant selector

**Task 1.5: Write derivation tests**

`packages/platform-core/src/launch/__tests__/contentDerivation.test.ts`:
- Test with complete product metadata → 0 warnings
- Test with missing optional fields → correct fallbacks, non-blocking warnings
- Test with ≤5 products → correct product grid / PDP pages
- Test derivation time < 10 seconds
- Test navigation structure correctness

---

### Phase 2: Wizard UI (Refactor Existing Configurator)

The existing configurator at `apps/cms/src/app/cms/configurator/` has all the infrastructure. The task is to create a focused "rapid launch" flow using existing state management.

**Task 2.1: Create rapid-launch wizard route**

Create `apps/cms/src/app/cms/configurator/rapid-launch/page.tsx` — a new wizard flow that reuses `ConfiguratorContext` but presents only 5 steps instead of 13.

**Task 2.2: Build Step 1 — Shop Identity**

Simplified version of existing `StepShopDetails.tsx`:
- Shop name (text input)
- Slug (auto-derived, shown as preview)
- Locale dropdown (single selection)
- Currency (auto-derived from locale)
- Remove: logo upload (moved to step 2), contact info (use prerequisite)

**Task 2.3: Build Step 2 — Theme + Brand Kit**

Combine existing `StepTheme.tsx` (theme selection) with brand kit upload:
- Show 1–2 themes from registry with previews (reuse `ThemeEditorForm.tsx` subset)
- Default theme pre-selected
- Three drag-and-drop upload zones (logo, favicon source, social image)
- Optional color override (single color picker, reuse `ColorThemeSelector.tsx`)
- Preview pane showing theme + brand applied

**Task 2.4: Build Step 3 — Product Selection**

New component (nothing equivalent exists):
- Fetch products from central inventory using a **launch-ready filter**:
  ```typescript
  // Launch-ready = routable + has required fields + in stock
  const launchReady = await centralInventory.listAll({
    filter: { routable: true, hasRequiredFields: true, inventoryGt: 0 }
  });
  ```
  Required fields: name, description, ≥1 image, price, SKU, ≥1 variant (or explicit none)
- Display as compact card grid: image thumbnail, name, price, stock level, "launch-ready" badge
- Checkboxes (≤5 selectable)
- If ≤5 launch-ready products exist, pre-check all
- If >20 launch-ready products exist, add search/filter controls (name search, collection filter)
- Show selected count / max
- Optional: support saved product sets ("collections") for repeat launches

**Task 2.5: Build Step 4 — Commerce Templates**

Simplified version combining `StepPaymentProvider.tsx` + `StepShipping.tsx`:
- Payment template: show 1–2 options from `providerTemplates` (payment group), default pre-selected
- Shipping template: show 1–3 options from `providerTemplates` (shipping group), default pre-selected
- VAT template: show single default, confirm-only
- Each option shows: name, description, capabilities list

**Task 2.6: Build Step 5 — Compliance + SEO**

New combined step:
- Legal bundle: show available bundles (terms + privacy + returns + accessibility as set), default pre-selected
- Consent template: show cookie consent options, default pre-selected
- SEO: auto-derived title (shop name + "| Online Shop") and description (from shop name + product names), editable

**Task 2.7: Add `rapidLaunch` curation fields to registries**

Add optional fields to theme, provider template, and legal bundle schemas:
```typescript
// In each registry item type:
rapidLaunch?: boolean;      // true = shown in rapid-launch wizard
rapidLaunchOrder?: number;  // sort order within rapid-launch wizard
```

- Theme registry: add to theme metadata in `packages/themes/` package.json or theme.json per theme
- Provider templates: add to `providerTemplates.ts` template objects
- Legal bundles: add to legal template group in `corePageTemplates.ts`

Tag at least 1 theme, 1 payment, 1 shipping, and 1 legal bundle as `rapidLaunch: true`. Fallback if no items are tagged: use first by creation date, log warning.

**Task 2.8: Add default pre-selection logic**

Add to `ConfiguratorContext` or a new `useRapidLaunchDefaults` hook:
- On wizard mount, query registries for defaults (first available theme, first payment/shipping template, first legal bundle)
- Pre-fill state with defaults
- Mark all steps as "valid" immediately (operator can just click Next through)

---

### Phase 3: Review UI (New)

Nothing like this exists. Build from scratch.

**Task 3.1: Build review page layout**

`apps/cms/src/app/cms/configurator/rapid-launch/review/page.tsx`:
- Left sidebar: page list with status icons (✓/⚠/✗)
- Main area: page preview (rendered components or static preview)
- Bottom bar: warnings panel (collapsible) + "Back to Configure" / "Launch" buttons

**Task 3.2: Build page preview renderer**

Render derived pages as read-only previews. Two approaches (pick one):
- **Approach A**: Use existing `PreviewRenderer.tsx` from page-builder with derived `components[]` → full fidelity but heavier
- **Approach B**: Simple HTML/CSS preview showing text content, images, and structure → lighter, faster, sufficient for review

Recommend **Approach B** for v1, with the following explicit guarantees:

**What the simple preview guarantees:**
- ✓ Content correctness: all text, images, prices, and links are visible and accurate
- ✓ Structural correctness: sections appear in correct order; navigation links are present
- ✓ Data binding: product names/prices/images match selected products
- ✗ Layout pixel fidelity: spacing, typography, and responsive behavior may differ from production
- ✗ Interactive behavior: carousels, modals, and animations are static

**Spot-check for fidelity**: in the review sidebar, include a "Preview in new tab" button for any page. This opens the page in the actual `PreviewRenderer` (full fidelity, slow to load). The operator can spot-check 1–2 pages if concerned about layout. This is optional and not counted in the 15-minute budget.

**Task 3.3: Build inline text editing**

For the simple preview, allow click-to-edit on text content:
- Click a text block → contentEditable activates
- On blur → update the derived page's component content in state
- Changes persist until re-derivation (going back to wizard and returning re-derives)

**Task 3.4: Build navigation preview component**

Show header + footer with actual nav items derived from pages. Read-only.

**Task 3.5: Trigger content derivation on entering review**

When operator advances from Step 5 to Review:
1. Upload brand kit files (if not already uploaded) → get URLs
2. Call content derivation engine (server action) with wizard state
3. Show loading spinner (<10 seconds)
4. Display results in review UI

---

### Phase 4: Launch UI (Adapt Existing)

The existing `useLaunchShop` hook and `/api/launch-shop` route do most of this. Adapt for the 3-stage model.

**Task 4.1: Create launch stage UI**

`apps/cms/src/app/cms/configurator/rapid-launch/launch/page.tsx`:
- Progress indicator with steps: Scaffold → Deploy → Gates → Sign-off → Production → Acceptance
- Reuse streaming response pattern from existing `useLaunchShop`
- Show each step as it completes (checkmark animation)

**Task 4.2: Render gate results in UI**

When gates complete, display structured results:
- Each gate as a row: icon (✓/✗) + name + message
- Failed gates show "Fix" button linking back to the relevant wizard step
- All-pass shows sign-off checklist

**Gate mapping table** (from existing `goLiveGates.ts`):

| Gate | Validates | Failure message | Fix link target |
|---|---|---|---|
| `pages-reachable` | All pages (9 fixed + N product) return 2xx | "Page {path} returned {status}" | Review → affected page |
| `checkout-session` | Stripe session creates with correct line items | "Checkout failed: {error}" | Configure → Commerce |
| `inventory-hold` | All selected products have inventory > 0 at gate time AND hold created on cart add with quantity decremented | "Product {name} is now OOS" or "Hold failed for SKU {sku}" | Configure → Products |
| `webhook-endpoint` | Synthetic signed payload accepted (200) | "Webhook rejected: {status}" | Admin prerequisite — "Contact administrator" (owner) or fix link (admin) |
| `email-sender` | SPF + DKIM records resolve for sender domain | "Email DNS missing: {record}" | Admin prerequisite — "Contact administrator" (owner) or fix link (admin) |
| `ssl-valid` | TLS cert valid and not expiring within 7 days | "TLS error: {detail}" | Admin prerequisite — "Contact administrator" (owner) or fix link (admin) |

Gates 4–6 are admin-provisioned prerequisites. They should not fail if preflight passed correctly. If they do, it indicates a race condition or infrastructure change during the session. The shop owner cannot resolve these — they require administrator intervention.

**Task 4.3: Add sign-off checklist UI**

After gates pass, show confirmation checkboxes:
- "I confirm the shop content is correct"
- "I confirm pricing and shipping are correct"
- "I confirm legal pages are approved"
- All checked → "Go Live" button enabled

**Task 4.4: Create rapid-launch server endpoint**

Create new `apps/cms/src/app/api/rapid-launch/route.ts` (separate from existing `launch-shop` endpoint to avoid regression risk to the existing full-configurator flow):
- Accept `DeriveContentOutput` (pages + navigation) alongside wizard state
- Pass derived pages to `createShop` / `initShop` instead of just template IDs
- Write brand kit files to shop data directory
- Trigger `syncToShopInventory` for selected products
- Re-verify product stock levels before proceeding (guards against race condition since wizard selection)
- Existing `launch-shop` route remains unchanged for the full-configurator flow

**Task 4.5: Wire go-live gates to CMS context**

Import gate functions from `scripts/src/launch-shop/goLiveGates.ts` (or extract to shared package):
- Currently gates live in `scripts/` — need to be callable from CMS server actions
- Option A: Extract to `packages/platform-core/src/launch/gates.ts`
- Option B: Call via internal API
- Recommend **Option A** (shared package, no network hop)

---

### Phase 5: Preflight at Wizard Entry

**Task 5.1: Move preflight to wizard open**

Create `apps/cms/src/app/cms/configurator/rapid-launch/preflight.ts` (server action):
- Run existing checks from `packages/platform-core/src/configurator.ts` (REQUIRED_CONFIG_CHECK_STEPS)
- Add missing checks: central inventory products, domain/Cloudflare zone, email sender SPF/DKIM
- Each check result includes: `{ key, passed, role: 'admin' | 'owner', message, fixUrl? }`
- `fixUrl` is only populated if the current user's role has permission to fix it
- Return structured results grouped by role

**Task 5.2: Build preflight UI gate**

On rapid-launch page mount:
- Run preflight server action
- Show checklist with pass/fail per check, grouped into "Platform setup" (admin) and "Your shop" (owner)
- Admin failures (when viewed by owner): red items with "Contact administrator" + admin email (no fix link)
- Admin failures (when viewed by admin): red items with "Fix" links to admin setup screens
- Owner failures: red items with "Fix" links to owner setup screens (visible to both roles)
- If any fail: disable wizard entry
- If all pass: show green checklist, wizard Step 1 becomes available

**Task 5.3: Prerequisite setup flows (Fix link targets)**

Prerequisites are owned by two roles (see [time budget § Roles](launch-time-budget.md#roles)). The preflight checks all of them, but fix links route differently based on who is logged in.

| Prerequisite | Role | Preflight check | Fix link target | Exists today? |
|---|---|---|---|---|
| **Stripe connected** | Admin | Payment provider linked with valid API keys | `/cms/rapid-launch/setup/payment-provider` | Yes — OAuth connect button works standalone |
| **Domain configured** | Admin | Cloudflare zone exists, DNS records point correctly | `/cms/rapid-launch/setup/hosting` | Yes — domain input + deploy polling exists |
| **Email sender verified** | Admin | SPF + DKIM records resolve for sender domain | `/cms/shop/[shop]/settings/email-sender` | **No** — needs a sender verification UI |
| **Shipping carrier active** | Admin | ≥1 shipping provider with rate table | `/cms/rapid-launch/setup/shipping` | Yes — provider selection exists |
| **Products in central inventory** | Owner | ≥1 routable product with required fields, inventory > 0 | `/cms/shop/[shop]/data/inventory` | Partial — CRUD exists, no guided "add product" flow |
| **Support email configured** | Owner | Non-empty, valid format | `/cms/shop/[shop]/settings` | Yes |
| **Returns address defined** | Owner | Non-empty | `/cms/shop/[shop]/settings` | Yes |

**Role-based fix link behavior:**

| Viewer role | Admin prerequisite fails | Owner prerequisite fails |
|---|---|---|
| **Shop owner** | "Contact administrator" (no link, shows admin email) | "Fix" link → owner setup screen |
| **Administrator** | "Fix" link → admin setup screen | "Fix" link → owner setup screen (admin can act on behalf of owner) |

**Implementation approach:**

1. **Admin setup screens at `/cms/rapid-launch/setup/[step]`.**
   Render existing configurator steps (`StepPaymentProvider`, `StepHosting`, `StepShipping`) in a standalone layout with a minimal `ConfiguratorContext`. These screens:
   - Are only accessible to admin-role users (RBAC-gated)
   - Save directly to the shop record (not wizard state)
   - Show a "Back to launch preflight" breadcrumb
   - Are the same screens the admin uses during initial shop provisioning

2. **Build new email sender verification UI** (`/cms/shop/[shop]/settings/email-sender`):
   - Input: sender email address + sender domain
   - Action: display required DNS records (SPF, DKIM) for the operator to add to their DNS provider
   - Verification: "Check records" button that runs DNS lookup and shows pass/fail per record
   - Stores verified sender domain on the shop record
   - RBAC: admin-only (involves DNS configuration)

3. **Owner setup screens (existing, extend as needed):**
   - Inventory UI at `/cms/shop/[shop]/data/inventory`: if no products exist, show "Add your first product" prompt with required fields (name, description, image, price, SKU, variant, stock quantity)
   - Shop editor at `/cms/shop/[shop]/settings`: support email + returns address fields already exist
   - The preflight check validates: ≥1 product where `routable && hasRequiredFields && inventory > 0`

4. **Fix link navigation:**
   - Each "Fix" link opens in the same tab with a "Back to launch preflight" breadcrumb
   - After the operator completes the setup, returning to the rapid-launch page re-runs preflight automatically
   - No polling while on the fix page (preflight re-runs on return)

5. **"Contact administrator" message** (for owner viewing admin failures):
   - Shows: "This requires administrator access. Contact {adminEmail} to resolve."
   - `adminEmail` is resolved from the shop's owning organization or a platform-level admin contact
   - No navigation — the owner cannot fix this themselves

**Task 5.4: Administrator handoff flow**

Before the shop owner can access the rapid-launch wizard, the administrator must:

1. **Create the shop record** in the CMS (existing flow at `/cms/configurator` or direct API)
2. **Complete admin prerequisites** (Stripe, domain, email, shipping — see table above)
3. **Invite the shop owner** to the CMS with single-shop access

The invitation flow:
- Admin navigates to `/cms/rbac` (existing `RbacManagementPanel`)
- Uses existing invite flow (`useInviteUserForm`) to create a user with `shop-owner` role scoped to the specific shop
- Owner receives invite email → creates account → sees their shop dashboard
- Dashboard includes a "Launch Shop" card (visible only when admin prerequisites pass)

**"Launch Shop" card visibility logic:**
```typescript
// Only show the launch card if:
// 1. Shop is not already launched
// 2. Admin prerequisites pass (checked server-side)
const showLaunchCard = !shop.launched && adminPreflightPassed;
```

If admin prerequisites are NOT met, the owner sees a "Setup in progress" message instead of the launch card. This prevents the owner from encountering admin-responsibility failures in preflight.

**What does NOT need building:**
- Stripe account creation/KYC (external — operator creates at stripe.com)
- Domain registration (external — operator registers with a registrar)
- Cloudflare account setup (external — we only need the zone to exist)
- Template/theme creation (developer-maintained platform assets)
- RBAC system (already exists — `RbacManagementPanel`, `useInviteUserForm`, role-scoped access)

---

### Phase 6: Reporting & Timing

Must implement the measurement specification defined in [launch-time-budget.md](launch-time-budget.md#measurement-specification).

**Task 6.1: Add stage-level timing to launch report**

Extend existing `LaunchReport` type in `scripts/src/launch-shop/types.ts`:
- Add `stages: { configure: TimeRange; review: TimeRange; launch: TimeRange }`
- Add `operatorActiveMs`, `endToEndElapsedMs`, `excludedWaitMs`, `pauseMs`
- Add `slaCompliant: boolean` (true if `operatorActiveMs <= 2_700_000`)

**Task 6.2: Instrument server-side phase events**

Emit structured events from the launch pipeline (used to compute `excludedWaitMs`):
- `deploy.preview.start` / `deploy.preview.ready`
- `gates.start` / `gates.complete`
- `deploy.production.start` / `deploy.production.ready`
- `acceptance.start` / `acceptance.pass`

These events are streamed to the client and stored in the launch report. The formula (per [time budget measurement spec](launch-time-budget.md#measurement-specification)):
```
excludedWaitMs = (deploy.preview.ready - deploy.preview.start) + (deploy.production.ready - deploy.production.start)
operatorActiveMs = endToEndElapsedMs - excludedWaitMs - pauseMs
```
"Ready" = URL reachable over HTTPS with valid TLS. This subsumes DNS and TLS wait. Gate execution is NOT excluded (operator reads streaming results).

**Task 6.3: Instrument wizard UI with timestamps**

In the rapid-launch wizard, record:
- `ui.stepTransition` events (step ID + timestamp) for each wizard step and stage
- `ui.idle.start` / `ui.idle.end` for pause detection (no interaction >5 min)
- Maximum 3 pauses per session; >3 flags the report as irregular
- Pass all client timestamps to launch report via the launch API

**Task 6.4: Include gate results in report**

Add gate results array to the launch report:
```typescript
gates: Array<{ name: string; passed: boolean; message: string; checkedAt: number; durationMs: number }>
```
Already partially exists in the pipeline — wire through to the new report format.

**Task 6.5: Track inline edits**

Record number and location of inline edits made during Review stage. Include in report as `inlineEdits: { count: number; fields: string[] }`. If count > 10, report includes a `derivationQualityWarning`.

**Task 6.6: Update operator runbook**

Update `docs/runbooks/launch-shop-runbook.md` to document the rapid-launch UI flow:
- Add "Rapid Launch (UI)" section alongside the existing CLI section
- Document the 3-stage wizard flow with screenshots/descriptions
- Document preflight requirements and how to resolve failures
- Document what the operator sees in Review and how to use inline editing
- Document gate results interpretation and recovery actions
- Keep existing CLI documentation intact (it remains valid for non-Basic launches)

---

## Design Decisions

### Curated subsets and override policy

Even though registries contain many options, the rapid-launch wizard surfaces only a curated subset per step to keep decision time bounded:

| Step | Options surfaced | Maximum | Curated by | Override policy |
|---|---|---|---|---|
| Theme | 1–2 from 10 in registry | 2 | Platform team (tag themes as `rapidLaunch: true`) | Color override only (single picker). No font or layout override in Basic. |
| Payment template | 1–2 from 3 available | 2 | Platform team (mark as `default: true`) | None in Basic (confirm only) |
| Shipping template | 1–3 from 4 available | 3 | Platform team | Selection only (no editing template content) |
| Legal bundle | 1 default | 1 | Legal team (mark as `approved: true`) | None in Basic (confirm only) |
| Consent template | 1 default | 1 | Legal team | None in Basic (confirm only) |

**Curation mechanism**: each registry item gets an optional `rapidLaunch: boolean` and `rapidLaunchOrder: number` field. The wizard queries with `{ rapidLaunch: true }` and sorts by order. If no items are tagged, the wizard uses the first item by creation date and logs a warning.

### Derivation warnings treatment

Warnings from the content derivation engine are:

- **Displayed to operator** during Review (yellow badges on affected pages)
- **Recorded in launch report** for post-launch audit
- **Not blocking**: warnings never prevent launch. If data is missing, fallbacks apply.
- **Not promoted to gates**: gates validate the live preview, not derivation quality. If a fallback produces a bad page, the operator catches it in Review.
- **Threshold alert**: if warnings > 5, the Review UI shows a banner suggesting the operator check product metadata quality.

### Pause policy

- Idle detection: no UI interaction for >5 continuous minutes
- Maximum pauses: 3 per session. After 3 pauses, the report is flagged as "irregular" (not invalid, but noted)
- No maximum pause duration. The operator can leave and return.
- Repeated pauses: each distinct idle period is a separate pause
- Total pause time is reported separately from operator-active time

### OOS products

- `inventory > 0` is required by the launch-ready filter. Products with zero stock are not shown in the wizard.
- Rationale: launching a shop with OOS products creates a poor first impression. If the operator wants an OOS product, they must restock first (prerequisite).
- Post-launch: products can go OOS naturally; OOS blocking prevents oversell.

---

## Implementation Sequence

```
Phase 1 (Content Derivation)     ← START HERE - critical path, no dependencies
    │
    │   Phase 5 (Preflight)      ← Can run in parallel with Phase 1
    │       │
    ▼       ▼
Phase 2 (Wizard UI)              ← Needs Phase 1 types; needs Phase 5 for entry gate
    │
    ▼
Phase 3 (Review UI)              ← Needs Phase 1 output + Phase 2 state
    │
    ▼
Phase 4 (Launch UI)              ← Needs Phase 3 output; adapts existing pipeline
    │
    ▼
Phase 6 (Reporting)              ← Wires into Phase 2/3/4 for timestamps
    │
    ▼
Integration Test                 ← Full flow end-to-end
```

**Parallelism**: Phases 1 and 5 can run concurrently. Phase 2 can start once Phase 1 types are defined (before implementation is complete). Phases 3 and 4 are sequential.

---

## Integration Tests

### Test 1: Content Derivation Quality

```bash
pnpm --filter @acme/platform-core test -- --testPathPattern contentDerivation
```

- 3 product sets (full metadata, partial metadata, minimal metadata)
- All pages generated (9 fixed + N product = 10–14 depending on product count), correct structure
- Legal pages contain verbatim bundle content
- Fallbacks applied, warnings logged (count matches expected)
- Duration < 10 seconds
- Navigation: 4 header items, 5 footer items
- Component schema matches page-builder format

### Test 2: End-to-End Dry Run

Cypress or Playwright test in `apps/cms`:
- Navigate to rapid-launch wizard
- Fill wizard (5 steps)
- Advance to review → pages generated
- Click launch (dry-run mode) → pipeline runs, gates evaluated
- Report generated with per-stage timing

### Test 3: Timed Launch (SLA Validation)

Trained operator, real infrastructure:
- `operatorActiveMs <= 2_700_000` (45 minutes)
- `excludedWaitMs` and `pauseMs` correctly computed (verify against manual stopwatch)
- All 6 gates pass on first attempt
- Acceptance test passes (all pages 2xx, checkout session, hold, webhook, email)
- Shop live at production URL
- Report `slaCompliant: true`

**Success threshold**: 3 consecutive launches, median operator-active time ≤ 45 min.

---

## Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Content derivation produces poor pages for real products | Stage 2 exceeds budget; manual edits needed | Medium | Strict prerequisite metadata; comprehensive test suite in Phase 1 |
| Template component prop shapes are inconsistent across page types | Derivation code is brittle, breaks on template updates | Medium | Integration tests lock template contracts; derivation tests use real templates |
| Extracting gates from `scripts/` to `platform-core` breaks existing CLI | CLI pipeline stops working | Low | Keep both: extract shared functions, CLI imports from new location |
| Existing configurator context/state conflicts with rapid-launch subset | State management bugs | Low | Rapid-launch uses own context instance, not shared singleton |
| Preview rendering is too slow (full PageBuilder) or too limited (simple HTML) | Review stage is frustrating | Medium | Start with simple HTML preview; upgrade to PageBuilder if time allows |

---

## Scope

### In Scope

- Content derivation engine (pure function, <10s, tested)
- Rapid-launch wizard UI (5 steps, defaults pre-selected)
- Review stage UI (page previews, inline editing, nav preview)
- Launch stage UI (progress, gate results, sign-off, production cutover)
- Preflight as wizard entry gate
- Per-stage timing and SLA reporting
- Integration tests proving 45-minute target
- Extracting go-live gates to shared package

### Out of Scope

- CLI tooling changes (existing pipeline remains as-is)
- New templates (use existing 16 page templates including legal group, + 9 provider templates)
- New themes (use existing 10)
- New inventory system (use existing central inventory)
- Standard/Enterprise tier launches
- Multi-shop rollouts
- Stripe Connect
- Template localization (single locale for v1)
- Full PageBuilder in review (use simple preview for v1)

---

## Success Criteria

1. Content derivation produces all pages (9 fixed + N product) in <10 seconds with zero required manual edits (given complete product metadata)
2. Preflight catches all missing prerequisites before wizard opens (zero mid-launch aborts)
3. Wizard completes in ≤15 min for trained operator (defaults confirmed, ≤3 overrides)
4. Review completes in ≤15 min (operator reads pages and approves; ≤10 inline edits if needed)
5. All 6 gates produce actionable errors with role-appropriate fix links (admin gates show "Contact administrator" for owner, direct fix links for admin)
6. 3 consecutive launches complete within 45 minutes of operator-active time
7. Launched shop passes acceptance test (HTTPS, all pages 2xx, checkout session, hold, webhook, email sender)
8. Launch report accurately records `operatorActiveMs`, `excludedWaitMs`, `pauseMs`, and `slaCompliant`
9. Shop owner can only see the "Launch Shop" card after admin prerequisites pass (no admin-failure dead ends in the owner experience)
10. Admin handoff flow works end-to-end: provision shop → complete admin prerequisites → invite owner → owner sees launch card

---

## Related Documents

- [Launch Time Budget](launch-time-budget.md) — stage-by-stage time allocation, acceptance criteria, SLA rules
- [Launch Shop Runbook](../runbooks/launch-shop-runbook.md) — operator guide (updated for UI flow in Task 6.6)
- [Predecessor Plan](archive/launch-shop-pipeline-plan.md) — original pipeline plan (complete)
- [CMS Fast-Launch](../cms-plan/master-thread.fast-launch.md) — CMS configurator vision
