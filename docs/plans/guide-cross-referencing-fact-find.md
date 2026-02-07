---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Guides / Content / SEO
Created: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: guide-cross-referencing
---

# Guide Cross-Referencing & Google Maps Links — Fact-Find Brief

## Scope

### Summary
Add a **robust, editor-friendly** cross-referencing approach for guides:
- Inline cross-references in body content (human-authored, contextual).
- A dedicated “Other relevant guides” block (curated, consistent, always present when configured).
- Reliable authoring and validation for Google Maps route links (e.g. “Hostel → main beach”).

This document focuses on the **long-term solution**: sustainable authoring, strong validation, minimal duplication across locales, and predictable rendering.

### Goals
- Make it easy to add/maintain high-quality cross-references while writing/editing a guide.
- Ensure cross-references are **correct** (no broken keys, no unsafe URLs) and **consistent** (same patterns across guide types).
- Establish a validation + reporting loop so cross-referencing coverage improves over time without becoming a manual audit burden.
- Keep the approach compatible with 18 locales and existing guide rendering.

### Non-goals
- Fully automatic cross-referencing (tag-based “recommendations” can remain supplemental, but not the primary system).
- CMS migration / non-git authoring workflow changes.
- A complete redesign of the guides architecture.

### Constraints & assumptions
- Guides are rendered via the existing “manifest + blocks + translated JSON content” pipeline.
- Inline links must be “plain in text” (token-based), not a bespoke widget system.
- Cross-references must not create hydration/SSR instability (follow existing “stable markup” patterns).
- Validation should run in CI and locally (scripts), and authoring should be supported in the in-app draft editor.

---

## User requirements (verbatim)
> “every guide needs to cross reference other relevant guides, whenever possible, both in line and in a 'other relevant guides' type block. we need to figure out how we take such opportunities. we also need to figure out how to link to routes in google maps i.e. hostel to main beach needs a link.”

---

## Repo audit (current state)

### 1) Inline link tokens (already functional)
- Rendering/parsing: `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`
- Supported tokens:
  - Internal guide links: `%LINK:guideKey|label%`
  - External links (incl. Google Maps): `%URL:https://…|label%` (only `http`, `https`, `mailto`)
  - How-to routes: `%HOWTO:slug|label%`
- Authoring UX already exists for `%LINK:` tokens:
  - Rich text editor insertion uses `sanitizeLinkLabel()` and a guide picker:
    `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/RichTextEditor.tsx`

### 2) “Related guides” UI component (already functional)
- UI: `apps/brikette/src/components/guides/RelatedGuides.tsx`
  - Labels are resolved via `getGuideLinkLabel(...)` so related guides can remain **key-only** and still render a localized (or EN-fallback) label.

### 3) Guide manifest supports related guides, but rendering is not “default”
- Manifest shape supports `relatedGuides: GuideKey[]`:
  `apps/brikette/src/routes/guides/guide-manifest.ts`
- Rendering in the UI is currently **block-driven**, not automatic:
  - The `relatedGuides` template prop is only merged when a `relatedGuides` block exists:
    `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx`
  - The UI only renders `RelatedGuides` when `relatedGuides` template prop exists:
    `apps/brikette/src/routes/guides/guide-seo/components/FooterWidgets.tsx`

### 4) Validation and tooling already exist (but do not enforce coverage)
- Content schema validation:
  - Zod schema: `apps/brikette/src/routes/guides/content-schema.ts`
  - CLI validator: `apps/brikette/scripts/validate-guide-content.ts`
  - In-app draft editor validates via the same schema (Raw JSON / editor flow).
- Link-token validation (build-time safety net for tokens):
  - CLI validator: `apps/brikette/scripts/validate-guide-links.ts`
  - Unit tests exist for token formatting and parsing.

---

## Coverage snapshot (as of 2026-01-29)

These numbers are intended to help scope the rollout and avoid hand-wavy “coverage” claims:
- English guide content files: **167**
- English guides containing at least one `%LINK:` token: **30**
- English guides containing a Google Maps `google.com/maps/(dir|search)` link: **4**
- Manifest entries containing `relatedGuides: [...]`: **135**
- Manifest entries containing a `blocks: [{ type: "relatedGuides", … }]` declaration: **78**

Implication: even where related guide data exists in the manifest, it may not be rendered if a `relatedGuides` block is absent.

---

## Key gaps (long-term)

### A) Canonical source of truth for “related guides” is unclear for editors
Today, the data is primarily TypeScript/manifest-driven, while much of authoring happens in translated JSON content (and via the draft editor). This creates friction:
- Editors can easily add inline `%LINK:` tokens.
- Editors cannot easily curate a consistent “Other relevant guides” list without touching manifest.

### B) Related guides rendering is not “default”
Having to remember to add a `relatedGuides` block per guide is a scalability issue: it is easy to forget, and it turns a “content quality requirement” into a “layout configuration requirement”.

### C) No coverage policy / reporting loop
We validate “correctness” of token syntax/targets, but we do not validate editorial completeness:
- No minimum related guides per guide (with exceptions).
- No detection of “orphaned” guides (zero inbound links / zero related guides).
- No report to guide editorial work (e.g., “these 12 guides are missing return-journey references”).

### D) Google Maps route links are valid but not ergonomic
`%URL:` works, but it’s easy to:
- paste overly long/opaque URLs,
- use inconsistent labels (“Google maps”, “Google Maps”, “map”, etc.),
- forget travel mode (walk vs transit),
- create links that are hard to maintain (place name ambiguity).

---

## Recommended direction (robust + editor-friendly)

### 1) Treat cross-referencing as a first-class editorial feature
Define a clear “cross-reference contract” that every guide should satisfy, with structured exceptions:
- A curated “Other relevant guides” list (the stable, always-available navigation block).
- A small number of contextual inline cross-links (not spammy; placed where they help decisions).
- Optional route links (Google Maps) for any guide that contains directions.

### 2) Use a non-localised store for `relatedGuides` (avoid 18× duplication)
**Decision: Option A** — curate `relatedGuides` in `guide-manifest.ts` (existing infrastructure).

Options considered:
- **Option A (CHOSEN):** curate `relatedGuides` in `guide-manifest.ts`.
  - Pros: already supported, typed keys, non-localised, Zod validation in place.
  - Cons: requires TypeScript PRs rather than content JSON edits.
- **Option B (rejected):** add `relatedGuides` to every locale's content JSON.
  - Cons: duplication across 18 locales; drift risk; unclear per-locale intent.
- **Option C (considered):** add a `guide-cross-references.{ts,json}` store keyed by `GuideKey`.
  - Pros: JSON-friendly, non-localised, focused editing.
  - Cons: requires new plumbing; Option A is simpler.

### 2.1) Manifest structure (already exists)
The existing manifest already supports this pattern:

```ts
{
  key: "positanoMainBeach",
  slug: "positano-main-beach",
  // ...
  relatedGuides: ["positanoBeaches", "positanoMainBeachWalkDown", "positanoMainBeachBusBack"],
  blocks: [/* ... */]
}
```

Validation rules (already enforced via Zod):
- All keys are valid `GuideKey`s.
- Need to add: de-duplication, no self-reference, optional `draftOnly` policy checks.

### 3) Make related guides rendering “default when configured”
Prefer a system rule like:
- If a guide resolves a non-empty `relatedGuides` list, render `RelatedGuides` in `FooterWidgets` by default.
- Keep explicit opt-outs (per guide) for edge cases.

This removes the need to remember a per-guide `relatedGuides` block and makes cross-referencing a content concern, not a layout concern.

### 3.1) Concrete technical spec (proposal): resolve related guides deterministically
Define a single resolution path that all routes use, so the system is predictable and testable:

**Inputs (in priority order):**
1. Explicit block options (`block.options.guides`) when a `relatedGuides` block is declared.
2. Manifest default (`manifest.relatedGuides`) when no block is declared.

**Normalization rules (always):**
- De-duplicate, preserve input order.
- Remove `guideKey` self-references.
- Validate all keys exist (hard error in validation scripts; never silently render broken links).
- Filter out `draftOnly` targets on `live` routes (per enforcement policy).

**Output:**
- A `RelatedGuidesConfig` that is stable and does not depend on client-only signals.

**Simplified rendering logic:**
- If normalized `relatedGuides` is non-empty, render `RelatedGuides` in `FooterWidgets` by default.
- Manifest can omit `relatedGuides` array (or leave empty) to suppress rendering.

### 4) Upgrade validation from “correctness only” to “correctness + coverage”
Keep existing validators, and add cross-reference coverage checks:
- **Correctness (already exists):**
  - `%LINK:` targets exist (`GuideKey`), `%HOWTO:` slugs exist, `%URL:` is safe.
- **Coverage (add):**
  - Live/review guides must meet a minimum policy, e.g.:
    - `relatedGuides.length >= 2` (or `>= 3` for high-traffic guide types).
    - At least one inbound link from another guide OR explicit “anchor guide” exemption.
  - Detect and report:
    - Self-links, duplicates, missing reciprocals (optional rule), links to draft-only guides, “orphan” guides.
  - Produce a human-readable report to guide editorial work (CSV/MD table).

### 5) Standardise Google Maps route links (and optionally add authoring helpers)
Recommend standardising on the `api=1` directions form:
- Directions: `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=walking|transit|driving`
- Search: `https://www.google.com/maps/search/?api=1&query=...`

Long-term, add an authoring helper (editor modal or script) that generates these URLs consistently from structured inputs (place names, coordinates, or place IDs).

---

## Editorial playbook (how to implement while writing/editing guides)

### “Other relevant guides” block (curated list)
For each guide, pick **2–6** related guides that match one of these intents:
1. **Overview** — “See all X” / “Start here”.
2. **Next step** — what a user will do immediately after reading.
3. **Alternative** — a comparable option (bus vs walk; beach A vs beach B).
4. **Return journey** — outbound guides should link to return guides where applicable.
5. **Prerequisite** — tickets, timing, booking, safety, seasonal constraints.

Avoid:
- Linking to everything (noise).
- Linking to “draft-only” routes unless the current guide is also draft-only (policy decision).

### Patterns by guide type (starting point)
These patterns are intended to reduce “blank page” editorial work and keep cross-referencing consistent:

**Beach guide**
- Beaches overview guide (“Compare beaches”).
- Primary “get there” guides (walk + bus) from the hostel.
- Primary “get back” guides (walk + bus) to the hostel.
- One “nearby/alternative beach” guide.

**Directions / route guide (A → B)**
- Destination guide (what to do once you arrive).
- Return guide (B → A) if it exists.
- One alternative route (walk vs bus vs ferry) when relevant.
- An overview hub (e.g., “How to get here” / “Getting around”).

**Overview / hub guide**
- The top 5–10 leaf guides it summarizes (but keep the related block small; use inline links to deepen coverage).
- One “start here” guide and one “planning” guide (tickets/seasonality).

**Experience / activity guide**
- Where it happens (beach/town/attraction guide).
- How to get there (directions guide).
- An alternative similar experience (optional).

### Inline links (contextual)
Use inline `%LINK:` tokens where they help the reader act:
- At decision points (“If ferries stop, switch to …”).
- Where the current guide intentionally omits detail (“See the step-by-step … guide”).
- For comparisons (“Unlike …, this beach …”).

Use the draft editor’s link picker (it already inserts `%LINK:` tokens safely).

### Google Maps route links
Where you give directions, include a map link:
- Label consistently (recommendation): “Google Maps walking route” / “Google Maps transit route”.
- Prefer `api=1` URLs so travel mode is explicit.

### Quick local validation (for editors/devs)
- Validate content schema: `pnpm --filter @apps/brikette validate-content`
- Validate link tokens: `pnpm --filter @apps/brikette validate-links`

---

## Implementation outline (planning feed)

### Phase 1 — Make the basics easy (high confidence)
- Make related guides rendering default when a non-empty `manifest.relatedGuides` exists (avoid per-guide block config).
- Add/extend validation for `relatedGuides` correctness (valid keys, no duplicates, no self-reference).
- Add coverage reporting to identify guides missing related guides (warn-only for `draft`/`review`, enforce for `live`).

### Phase 2 — Coverage, reporting, and enforcement (medium confidence)
- Define a cross-reference coverage policy by guide type (beaches, directions, overview, experiences).
- Enhance report generator to surface:
  - missing related guides (enforce minimum count for `live` guides),
  - missing reciprocal links (warn-only),
  - orphans (no inbound links),
  - unbalanced hubs (too many outbound, no curated "overview").
- Enforce coverage policy for `live` guides only (decided); `review` and `draft` remain warning-only.

### Phase 3 — Google Maps ergonomics (medium confidence)
- Add a helper to generate `api=1` URLs consistently (script or editor UI).
- Optionally add a semantic token wrapper (e.g. `%URL:` remains the storage format, but UI generates the URL).
- Add validation checks for common maps mistakes (missing `api=1`, missing travel mode where relevant).

---

## Decisions made

1. **Canonical storage for related guides:** Option A (curate in `guide-manifest.ts`)
   - Keeps existing typed infrastructure, non-localized, validated via Zod
   - Trade-off: requires TypeScript PRs rather than content JSON edits

2. **Render related guides when content is unlocalized:** YES
   - Navigation is helpful regardless of translation status
   - Guide labels already have EN fallback via `getGuideLinkLabel()`

3. **Enforcement scope:** `live` guides only (initially)
   - Enforce coverage policies on `live` status first
   - Expand to `review` once workflow is smooth
   - Leave `draft` guides unconstrained to avoid friction during exploration

4. **Reciprocity enforcement:** Warn-only
   - Report missing reciprocal links as warnings, not errors
   - Allows editorial judgment (not all relationships are symmetric)

## Open questions (still to decide)

5. Do we want to support custom titles per related-guides block?
   - Recommendation: keep a default ("Other relevant guides"), allow override only when truly necessary (avoid fragmentation).
6. Should we add a dedicated "Maps" token?
   - Recommendation: not required if we provide a generator and keep `%URL:` as the transport.

---

## Pending audit work (to raise confidence)
- Map how many guides currently have `relatedGuides` data but don't render it (missing block vs missing data).
- Identify guide types (beaches / directions / overview) and propose a minimal policy per type.
- Confirm whether existing validators are invoked in the repo-wide validation script and where best to enforce coverage.

---

## Files referenced
- `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`
- `apps/brikette/src/components/guides/RelatedGuides.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/FooterWidgets.tsx`
- `apps/brikette/src/routes/guides/guide-manifest.ts`
- `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx`
- `apps/brikette/src/routes/guides/content-schema.ts`
- `apps/brikette/scripts/validate-guide-content.ts`
- `apps/brikette/scripts/validate-guide-links.ts`
- `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/RichTextEditor.tsx`
