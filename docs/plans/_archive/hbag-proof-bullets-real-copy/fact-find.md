---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Mixed
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-proof-bullets-real-copy
Dispatch-ID: IDEA-DISPATCH-20260228-0003
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-proof-bullets-real-copy/plan.md
Trigger-Why: The PDP proof bullet section currently renders internal system strings that expose the materializer's unfilled state to real customers. This is an active correctness failure, not just a quality gap — visitors to the live site see "Generated from canonical packet and source ledger" where product copy should appear.
Trigger-Intended-Outcome: type: operational | statement: Replace the three placeholder proof bullets in site-content.generated.json with five real customer-facing proof bullets reflecting material characteristics, craft signals, Italian-design provenance, and the 30-day/90-day guarantee — then update the materializer so future regeneration produces real copy, not placeholders. | source: operator
---

# HBAG Proof Bullets — Real Customer Copy

## Scope

### Summary

The Caryina PDP (`/[lang]/product/[slug]`) renders a "Product proof points" section that currently displays three internal system placeholder strings instead of customer-facing copy. The strings ("Generated from canonical packet and source ledger", "Claims constrained by packet and lint contracts", "Policy and support blocks remain deterministic") are hardcoded in the `buildPayload()` function of the startup-loop materializer. The generated JSON is committed to the repo at `data/shops/caryina/site-content.generated.json` and read directly by the Next.js app at build/runtime — no API layer, no CMS.

The fix has two parts:

1. **Content authoring:** Write real proof bullets sourced from evidence in the canonical product and offer documents, respecting all claim constraints (no specific leather type, no "Made in Italy", no unverified dimensions).
2. **Materializer update:** Replace the hardcoded placeholder strings in `scripts/src/startup-loop/materialize-site-content-payload.ts` (`buildPayload()`, `productPage.proofBullets` block) with real content (Approach A) or extract from the content packet section (Approach B). Then re-run the materializer to regenerate `site-content.generated.json`. The committed JSON should be updated via materializer re-run — not by hand-editing the JSON — to preserve generator-source discipline.

### Goals

- Remove all placeholder system text from the PDP before any listing goes live.
- Replace with five (5) real proof bullets that justify the €89–€99 price point through material, craft, provenance, and guarantee signals — without over-justifying (brand voice: confident, not apologetic).
- Update the materializer source so future regeneration produces real copy.
- Add a lint-time check (or extend the existing linter) to prevent placeholder strings from surviving in the generated JSON.

### Non-goals

- Full i18n translation of the proof bullets (launch is English-first; the `en` key is sufficient for launch).
- Redesigning the PDP proof section layout or adding new UI elements.
- Resolving unconfirmed product attributes (material substrate, exact dimensions, V2 facade status) — copy must be authored within current evidence constraints.
- Addressing the companion dispatch items (IDEA-DISPATCH-20260228-0004 through 0007) — those are separate fact-finds.

### Constraints & Assumptions

- Constraints:
  - Do not claim "genuine leather" or any specific material substrate — PRODUCT-01 classifies exterior material as UNKNOWN/APPARENT.
  - Do not claim "Made in Italy" — only "Designed in Italy" / "Designed in Positano" is evidenced. Source: `HBAG-offer.md` §4.
  - Do not use "Birkin" in any public copy. Source: `HBAG-offer.md` §4 (2025 Paris Judicial Court ruling).
  - Do not state exact dimensions or weight — no scale reference confirmed in PRODUCT-01.
  - Do not claim "100% X" or "certified" for any material or compliance attribute.
  - Hardware attachment method (clip/carabiner/keyring) is architecturally required but not photographically confirmed — mention hardware guarantee without specifying attachment type.
  - Brand voice constraints: no "luxury", "premium", "exclusive", "statement piece", "must-have", "turn heads". Show craft, don't claim it. Source: `HBAG-offer.md` §3 and `2026-02-21-brand-identity-dossier.user.md`.
- Assumptions:
  - The `proofBullets` field is shared across all SKUs (not per-product). This is confirmed by the data schema in `contentPacket.ts` — `productPage.proofBullets` is a single array on the `productPage` object, not per-variant.
  - The materializer is re-run via `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina` to update the generated JSON. The committed JSON must also be updated directly for immediate effect.
  - The 30-day exchange and 90-day hardware guarantee are commitments already live in `HBAG-offer.md` — these can be stated.

## Outcome Contract

- **Why:** The PDP proof bullet section currently shows internal system strings to live visitors. This must be corrected before any Etsy listing or ad traffic is sent to the site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The `productPage.proofBullets` array in `data/shops/caryina/site-content.generated.json` contains five real, customer-facing proof bullets. The materializer's `buildPayload()` function produces equivalent real copy when re-run. A lint rule blocks future placeholder text from surviving into the output.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` lines 69, 113–128 — calls `getProductPageContent(lang)` and renders `productPageContent.proofBullets` as a `<ul>` list inside a `<section aria-label="Product proof points">`. This is the customer-visible render path.

### Key Modules / Files

- `data/shops/caryina/site-content.generated.json` — committed generated artifact; `productPage.proofBullets` array at lines 118–127 contains the three placeholder strings. This is what the live site currently serves.
- `scripts/src/startup-loop/materialize-site-content-payload.ts` — the materializer. The `buildPayload()` function at lines 272–279 hardcodes the three placeholder strings in `productPage.proofBullets`. **This is the canonical fix location.**
- `apps/caryina/src/lib/contentPacket.ts` — reads the generated JSON at `data/shops/caryina/site-content.generated.json`, caches it, and exports `getProductPageContent(locale)` which returns `proofBullets` as `string[]`. No transformation — it passes through the array verbatim after locale resolution.
- `docs/business-os/startup-baselines/HBAG-content-packet.md` — canonical content packet. Currently hand-authored (not generated by the compiler); contains the `## Reusable Trust Blocks` section used as the source for copy signals. Does **not** currently contain a `## Proof Bullets` section — this must be added as part of the fix so the packet becomes the source of truth.
- `docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md` — PRODUCT-01 spec. Section 5.1 lists approved evidence-locked feature bullets; section 5.2 lists what can and cannot be claimed. This is the claim-safety gate for all copy.
- `docs/business-os/strategy/HBAG/products-line-mapping.user.md` — PRODUCTS-01 line mapping. Contains differentiation notes vs Etsy field and competitive context that informs proof bullet framing.
- `docs/business-os/startup-baselines/HBAG-offer.md` — offer design. Contains the core promise, proof frame, risk reversals, brand voice constraints, and the three core lines ("Made to be shown.", "Considered detail.", "Use every day.").
- `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md` — brand language. Personality: sophisticated, curated, feminine, confident, not apologetic. Words to avoid confirmed.
- `scripts/src/startup-loop/lint-website-content-packet.ts` — linter for the content packet (not the generated JSON). Should be extended or a companion linter added to detect placeholder strings in the generated output.
- `scripts/src/startup-loop/__tests__/materialize-site-content-payload.test.ts` — existing materializer tests. Currently asserts on `generatedAt`, `sourcePaths`, and `seoKeywords` — no test asserts on `proofBullets` content or on placeholder-string absence.

### Patterns & Conventions Observed

- **Materializer is the canonical source of all generated content:** The JSON at `data/shops/caryina/site-content.generated.json` is written by `materializeSiteContentPayload()`. It is committed to the repo (not gitignored), so the app reads the committed file at build/runtime. This means fixing the JSON requires both updating the committed file AND fixing the materializer so future re-runs don't regress.
- **Locale fallback pattern:** `contentPacket.ts` uses `value[locale] ?? value.en` — English-only is sufficient for launch; no translation work required.
- **No extraction from packet markdown:** Unlike `seoKeywords` (extracted from `## Primary transactional clusters` / `## Secondary support clusters` sections via `extractBulletList()`), `proofBullets` is currently fully hardcoded — the materializer does not parse the content packet for proof bullet content. Two viable fix approaches exist: (A) keep hardcoding in the materializer with real copy, or (B) add a `## Product Proof Bullets` section to the content packet and extend `extractBulletList()` to extract from it (more maintainable; preferred).
- **Claim safety gate:** PRODUCT-01 (section 5.2) defines what sales can and cannot say. The materializer should only produce claims that pass this gate. The current state fails the gate entirely by rendering system metadata.
- **Content packet as source of truth:** `HBAG-content-packet.md` already holds `## Reusable Trust Blocks` (three lines: designed in Positano, six-view gallery, 30-day exchange + 90-day hardware support). These map directly to proof bullet framing.

### Data & Contracts

- Types/schemas/events:
  - `SiteContentPayload` (defined in both `materialize-site-content-payload.ts` and mirrored in `contentPacket.ts`): `productPage.proofBullets` is typed as `LocalizedText[]` = `Array<Partial<Record<"en" | "de" | "it", string>> & { en: string }>`. Minimum required: the `en` key on each element.
  - The app's `contentPacket.ts` types this identically: `proofBullets: LocalizedText[]` where `LocalizedText = { en: string; de?: string; it?: string }`.
  - No DB schema involved — this is a static JSON file.
- Persistence:
  - `data/shops/caryina/site-content.generated.json` — committed to git, read from filesystem at app startup (Node.js `fs.readFileSync`, cached in module scope via `cachedPayload`).
  - Materializer writes the file when invoked with `write: true` (default).
- API/contracts:
  - No API. The content is static-file sourced. The app hot-reloads if the file changes in dev; in production the build snapshot is what ships.

### Dependency & Impact Map

- Upstream dependencies:
  - `docs/business-os/startup-baselines/HBAG-content-packet.md` (if Approach B — extract from packet section)
  - `docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md` (claim constraints gate)
  - `docs/business-os/startup-baselines/HBAG-offer.md` (proof frame, guarantees, voice)
- Downstream dependents:
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — the sole consumer of `getProductPageContent()`. Change to the JSON is immediately reflected on the PDP for all locales.
  - All build outputs (static export or Worker) will pick up the updated JSON at build time.
- Likely blast radius:
  - Contained. Only `productPage.proofBullets` changes. No type changes required — the existing `LocalizedText[]` shape accommodates the real copy. No UI changes needed. No test failures expected from the content change itself (existing tests don't assert on bullet content). Materializer test suite must be updated to assert on real content (non-placeholder) in `proofBullets`.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (scripts package), configured via `jest.config.cjs` at repo root.
- Commands: Tests run in CI only (per `docs/testing-policy.md` line 15: "All Jest and e2e tests run in GitHub Actions CI only. Do not run test commands locally."). New test cases are authored locally and validated through the CI pipeline.
- CI integration: Scripts tests run in the standard CI pipeline.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Materializer core | Unit | `scripts/src/startup-loop/__tests__/materialize-site-content-payload.test.ts` | Covers: packet missing (TC-04-02), deterministic output from packet (TC-04-01), logistics path. Does NOT assert on `proofBullets` content or placeholder-string absence. |
| Lint website content packet | Unit | `scripts/src/startup-loop/__tests__/lint-website-content-packet.test.ts` | Lints the packet markdown, not the generated JSON output. |
| Compile website content packet | Unit | `scripts/src/startup-loop/__tests__/compile-website-content-packet.test.ts` | Covers compile path from source files to packet; not the materializer output. |

#### Coverage Gaps

- Untested paths:
  - No test asserts that `proofBullets` in the output JSON contains non-placeholder, non-empty real strings.
  - No test asserts that the generated JSON output does not contain the known bad placeholder strings.
- Required new tests:
  - TC-proof-bullets-01: materializer with real content packet produces `proofBullets` where each bullet does not contain "Generated from canonical packet" / "constrained by packet" / "remain deterministic".
  - TC-proof-bullets-02: (if Approach B) extractBulletList parses a `## Product Proof Bullets` section correctly from the packet.

#### Recommended Test Approach

- Unit tests: extend `materialize-site-content-payload.test.ts` with assertions on `proofBullets` — at minimum, assert each bullet is a non-empty, non-placeholder string. Optionally assert on expected real bullet content if hardcoded (Approach A), or on bullet count and non-empty if extracted (Approach B).

### Recent Git History (Targeted)

- `2ac91e7e5a` — "chore: commit outstanding work" — last update to `site-content.generated.json` and `HBAG-content-packet.md`. No specific proof-bullet changes observed.
- `7651c6982c` — "feat(business-os): harden guide authoring manifest flow" — unrelated to materializer.
- Materializer was last substantively changed in early commits when the HBAG pipeline was first built; placeholder strings are from initial scaffolding.

## External Research

Not required — all evidence is in the repository. Product claims are bounded by PRODUCT-01 constraints already investigated.

## Questions

### Resolved

- Q: Where does the materializer currently get proof bullet content?
  - A: Hardcoded strings in `buildPayload()` in `materialize-site-content-payload.ts` at lines 274–279. Not extracted from the content packet — pure scaffold defaults.
  - Evidence: `scripts/src/startup-loop/materialize-site-content-payload.ts` lines 272–279.

- Q: Is `proofBullets` shared across all SKUs or per-product?
  - A: Shared. It is on the `productPage` object in `SiteContentPayload`, not on individual product records. All SKU detail pages receive the same proof bullets.
  - Evidence: `contentPacket.ts` interface definition; `site-content.generated.json` schema.

- Q: Can the content packet markdown be used as the extraction source, or must the materializer be hardcoded?
  - A: Both approaches are viable. Approach A (hardcode real strings) is simpler and faster. Approach B (add `## Product Proof Bullets` section to the packet and extend `extractBulletList()`) is more maintainable and follows the existing pattern used for SEO keywords. Approach B is recommended — it makes the content packet the single source of truth, which is the stated architecture intent of `HBAG-content-packet.md`.
  - Evidence: `materialize-site-content-payload.ts` `extractSeoKeywords()` function and `extractBulletList()` helper; `HBAG-content-packet.md` as the declared source of truth.

- Q: What evidence-safe content can go into the proof bullets?
  - A: The following are confirmed-safe from PRODUCT-01 section 5.1/5.2 and the offer doc:
    1. Structured silhouette with side gussets — OBSERVED.
    2. Turn-lock style clasp closure — OBSERVED.
    3. Dual top handles — OBSERVED.
    4. Facade applique with three arched windows (on V1 and V3 colorways) — OBSERVED, variant-controlled.
    5. Multiple textured exterior finishes — OBSERVED (metallic emboss / croc emboss / pebbled grain).
    6. Designed in Positano, Italy — confirmed business fact (not manufacturing claim).
    7. 30-day exchange — confirmed in `HBAG-offer.md`.
    8. 90-day hardware guarantee — confirmed in `HBAG-offer.md`.
    Excluded: specific leather type, exact dimensions, material composition, "Made in Italy", hardware attachment type (clip/carabiner — not photographed), "gold-tone" hardware finish (V3 clasp finish is APPARENT mixed/conflict per PRODUCT-01 section 2.4 HW1 — use "polished metal" as the safe generalisation).
  - Evidence: PRODUCT-01 section 5.1 "Feature Bullets (no unverified claims)"; HBAG-offer.md §3 guarantees and §3 brand voice.

- Q: How many proof bullets is the right number?
  - A: The current UI is a simple `<ul>` with no cap. Five bullets is optimal: covers materials/craft, provenance, hardware, finish variety, and guarantee without becoming a spec sheet. The brand voice constraint ("copy should never feel like a spec sheet") argues against more than six.
  - Evidence: `HBAG-offer.md` §3 voice constraints; PDP layout in `page.tsx`.

- Q: Do the placeholder strings currently appear on the live/staging site?
  - A: Yes. The committed `site-content.generated.json` contains the placeholders. The app reads this file at runtime/build. There is no environment gate. Any visitor to the PDP sees these strings.
  - Evidence: `data/shops/caryina/site-content.generated.json` lines 119–127; `contentPacket.ts` `readPayload()` which reads the committed file unconditionally.

### Open (Operator Input Required)

- Q: Should the proof bullets be generic to all colorways, or should V1/V2/V3 have per-colorway variants of bullet 4 (facade applique)?
  - Why operator input is required: The facade applique is present on V1 and V3 but unconfirmed for V2. If a single shared bullet mentions the facade, it is technically inaccurate for V2 listings. If V2 does not have a facade (the likely scenario given its front panel was not photographed showing one), the bullet needs variant-aware handling — which the current schema does not support.
  - Decision impacted: Whether bullet 4 is a universal claim or must be omitted/qualified. Also impacts whether a per-product proof bullet capability is needed in a follow-on.
  - Decision owner: Pete (operator)
  - Default assumption + risk: Default to a generic bullet that says "selected colorways feature a stitched building facade applique" — this is honest about variant-controlled presence without requiring schema changes. Risk: mild — reads as vague, but claim-safe.

## Draft Proof Bullets

The following five bullets are proposed, authored against PRODUCT-01 constraints and the offer voice:

1. **Structured silhouette, top-handle carry.** A shaped body with side gussets holds its form — designed to hang from a bag strap, not fold into it.
2. **Turn-lock hardware closure.** A front strap with a turn-lock clasp closes the bag cleanly. Polished metal hardware on the strap keeper and clasp plate.
3. **Designed in Positano, Italy.** Manufactured to specification; designed in Italy. The Amalfi origin story is in the object, not just the packaging.
4. **Textured finishes across colorways.** Three exterior textures: metallic reptile emboss (Silver), croc emboss (White/Rose Splash), and pebbled grain (Peach). Selected colorways include a stitched building facade applique.
5. **30-day free exchange, 90-day hardware guarantee.** Wrong colour, changed mind — exchange within 30 days. If the hardware fails in the first 90 days of normal use: replacement, no forms required.

*Claim-safety check: No specific leather type claimed. No dimensions stated. No "Made in Italy". No "luxury" or "premium". Hardware attachment not specified. Hardware finish uses "polished metal" (not "gold-tone") to stay claim-safe given V3 hardware finish conflict flagged in PRODUCT-01 section 2.4 (HW1: "V3 APPARENT mixed silver/gold — CONFLICT"). Facade qualified as "selected colorways". All observable attributes sourced from PRODUCT-01 section 5.1.*

## Confidence Inputs

- Implementation: 95%
  - Basis: The exact file to edit, the exact function to modify (`buildPayload()`), and the exact JSON key (`productPage.proofBullets`) are all confirmed. No ambiguity about where the fix lives.
  - Raises to 98%: Re-running materializer and confirming output matches expectation.

- Approach: 85%
  - Basis: Approach B (extract from content packet section) is architecturally correct but adds a small parsing step. The `extractBulletList()` helper already exists; the pattern is established for SEO keywords.
  - Raises to 90%: Confirming the content packet section name is stable and won't conflict with future packet compiler runs.
  - Note: Approach A (hardcode) would be 95% confidence — simpler but less maintainable.

- Impact: 90%
  - Basis: The fix directly removes customer-visible placeholder text. The PDP is the bottom-of-funnel page — this is where purchase decisions happen. The current state is actively harmful to conversion.
  - Raises to 95%: Photography perception test (TASK-06) completed — confirms the PDP as a whole reads at the right price tier.

- Delivery-Readiness: 88%
  - Basis: All source evidence exists. Draft copy is in this document. No blocked upstream. Two tasks: content packet update + materializer patch.
  - Raises to 92%: Operator confirms the open question on facade applique handling (per-colorway vs generic bullet).

- Testability: 82%
  - Basis: Materializer unit tests exist and can be extended. The pattern for writing content assertions against the materializer output is straightforward (parse JSON, check `proofBullets` array).
  - Raises to 90%: New test cases added for placeholder-free output.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| V2 facade status remains unknown — a shared bullet overstates V2's features | Medium | Low — the bullet uses "selected colorways" qualifier, which is accurate | Default to the qualified wording; revisit when V2 front photo is obtained |
| Materializer re-run overwrites a hand-edited committed JSON | Medium | Medium — if the materializer is run with the old hardcoded defaults, the fix regresses | The materializer fix must go into `buildPayload()` (Approach A) or the content packet section (Approach B) before the committed JSON is updated; both must land in the same commit |
| Content packet compiler (`compile-website-content-packet.ts`) overwrites the HBAG content packet and removes the new `## Product Proof Bullets` section | Medium | Medium — the compiler writes to `docs/business-os/startup-baselines/${business}-content-packet.md` (confirmed: `compile-website-content-packet.ts` line 375); running it for HBAG would overwrite the hand-authored packet with a template shell, losing the proof bullet section | Guardrail: do not run the compiler for HBAG after the proof bullet section is added without first porting content into a compiler extension. Add a comment to the packet noting this risk. |
| Proof bullets are too long and "feel like a spec sheet" | Low | Low — brand voice risk, not a functional risk | Cap bullets at ~20 words each; the draft above is within that range |

## Planning Constraints & Notes

- Must-follow patterns:
  - All copy claims must be traceable to PRODUCT-01 (section 5.1 approved claims list) or the offer doc (guarantees section).
  - The committed JSON and the materializer source must be updated in the same PR — no gap state where the JSON has real copy but the materializer would regress it on next run.
  - Use Approach B (packet section extraction) unless the operator prefers the simpler hardcode path.
- Rollout/rollback expectations:
  - No feature flag needed. The change is content, not code behavior. Rollback = revert the commit.
- Observability expectations:
  - No measurement hook needed for this fix. The test suite catching placeholder strings is the observability layer.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Materializer source and buildPayload() function | Yes | None | No |
| Generated JSON committed state | Yes | None | No |
| PDP render path (page.tsx → contentPacket.ts → JSON) | Yes | None | No |
| Content packet markdown and source ledger | Yes | None | No |
| Product claim constraints (PRODUCT-01) | Yes | None | No |
| Brand voice constraints (offer doc, brand dossier) | Yes | None | No |
| Test landscape for materializer | Yes | Gap: no assertion on proofBullets content — advisory only | No (addressed in task seeds) |
| Blast radius (per-variant vs shared proof bullets) | Partial | Open question on V2 facade — operator input needed but non-blocking with default wording | No |

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `## Product Proof Bullets` section to `docs/business-os/startup-baselines/HBAG-content-packet.md` with the five draft bullets from this fact-find.
- TASK-02: Extend `extractBulletList()` usage in `materialize-site-content-payload.ts` `buildPayload()` to extract `proofBullets` from the new content packet section (Approach B). If the section is missing or yields zero bullets, the materializer should fail-closed (emit a diagnostic error and refuse to write output) rather than silently falling back to empty or placeholder strings — this prevents future regressions from being silently committed.
- TASK-03: Re-run the materializer (`pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina`) and commit the updated `data/shops/caryina/site-content.generated.json`.
- TASK-04: Add test cases to `materialize-site-content-payload.test.ts` asserting that `proofBullets` in the output does not contain the placeholder strings and that each bullet is non-empty.
- TASK-05 (optional): Add a lint rule or extend `lint-website-content-packet.ts` to detect known placeholder strings in generated JSON artifacts.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `data/shops/caryina/site-content.generated.json` has `productPage.proofBullets` with 5 real, non-placeholder strings.
  - `scripts/src/startup-loop/materialize-site-content-payload.ts` `buildPayload()` no longer contains the three placeholder strings.
  - `docs/business-os/startup-baselines/HBAG-content-packet.md` has a `## Product Proof Bullets` section.
  - New materializer test cases pass.
- Post-delivery measurement plan:
  - Manual spot-check: load `/en/product/caryina-mini-facade-bag-charm-silver` and confirm the proof section shows real copy.
  - Automated: materializer test suite passes in CI.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: All claims (placeholder location, content packet structure, render path, claim constraints) are traced to specific files and line ranges. Inferred claims (V2 facade absence) are explicitly marked as UNKNOWN/unconfirmed.
- Boundary coverage: The full pipeline is traced — content packet → materializer → committed JSON → `contentPacket.ts` → `page.tsx`. No API boundary involved.
- Test coverage: Existing gap (no assertion on `proofBullets` content) identified and addressed in task seeds.
- Business validation: Draft copy validated against PRODUCT-01 section 5.2 (approved/prohibited claims) and brand voice constraints from `HBAG-offer.md` and brand dossier.

### Confidence Adjustments

- Delivery-Readiness adjusted from initial 92% to 88% because the open question on V2 facade handling is non-blocking but adds one sentence of copy review. Operator confirmation would raise it back to 92%.
- Testability is 82% (not 90%) because the new test cases are specified but not yet written — straightforward but not yet confirmed.

### Remaining Assumptions

- V2 colorway lacks a facade applique (the default "selected colorways" qualifier makes this assumption safe without confirming it).
- The `compile-website-content-packet.ts` compiler WILL overwrite `HBAG-content-packet.md` if invoked for HBAG (compiler line 375 confirmed). This is flagged as a Medium risk above; the build plan must include a guardrail against running the compiler on HBAG after the proof bullet section is added.
- Five bullets is the right count — no explicit UI cap confirmed but brand voice and PDP layout support this.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan hbag-proof-bullets-real-copy --auto`
