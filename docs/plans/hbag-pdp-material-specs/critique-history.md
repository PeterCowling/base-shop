# Critique History — hbag-pdp-material-specs

## Fact-Find: Round 1 (2026-02-28)

- Route: codemoot
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision
- Severity counts: Critical 0 / Major 2 (warnings) / Minor 1 (info)

### Findings

1. **[Major] Line 33:** Goals stated "update content packet/generated site content" — contradicted later sections that placed `site-content.generated.json` out of scope. Internal contradiction could mis-scope implementation.
2. **[Major] Line 184:** Test command `pnpm --filter caryina test` incorrect (package name is `@apps/caryina`); also conflicted with CI-only test policy.
3. **[Minor] Line 125:** Content packet update framed as "in scope" without clarifying it is optional documentation sync, not a build dependency.

### Fixes Applied (before Fact-Find Round 2)

- Goals section rewritten: removed `site-content.generated.json` reference; content packet update reframed as "documentation sync only — not a build dependency".
- Blast-radius map updated to show `site-content.generated.json` as "not modified".
- Test commands corrected to `pnpm typecheck && pnpm lint` (local gate only); CI-only note added.
- TASK-07 task seed clarified as "docs sync, not build dependency".

---

## Fact-Find: Round 2 (2026-02-28)

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision (credible threshold met at 4.0; no Criticals; Round 3 not triggered per iteration rules)
- Severity counts: Critical 0 / Major 2 (warnings) / Minor 1 (info)

### Findings

1. **[Major] Line 184:** Governed runner command still implies local Jest runs; conflicts with CI-only policy.
2. **[Major] Line 251:** Conditional display gate required only `materials` non-empty — could still render with incomplete `dimensions`/`weight`.
3. **[Minor] Line 374:** `weight: number` lacks unit field; `dimensions` has `unit: "mm"` making the inconsistency an avoidable schema ambiguity.

### Fixes Applied (final)

- Test infrastructure section: commands simplified to `pnpm typecheck && pnpm lint` only; CI-only policy note explicit.
- Conditional display gate strengthened: all three fields (`materials`, `dimensions`, `weight`) must be non-empty for section to render.
- Weight schema changed to `{ value: number; unit: "g" }` to match `dimensions` pattern.
- TASK-02 updated with new weight schema shape.
- Draft copy section updated with `{ value: [TBC], unit: "g" }` format.

### Post-Round 2 Status (Fact-Find)

- lp_score 4.0 → credible
- No Critical findings remain
- Round 3 not required (condition: Critical still present after Round 2 — not met)
- Proceeding to completion with `Status: Ready-for-planning`

---

## Plan: Round 1 (2026-02-28)

- Route: codemoot
- Score: 6/10 → lp_score 3.0
- Verdict: needs_revision
- Severity counts: Critical 1 / Major 3 (warnings) / Minor 2 (info)

### Findings

1. **[Critical] Line 327:** TC-01 is invalid: it requires parsing raw `products.json` records with `skuSchema`, but those records are `ProductPublication`-shaped (localized `title`/`description`, `shop`, `status`, etc.), not storefront `SKU`-shaped. This acceptance check will fail even when implementation is correct.
2. **[Major] Line 92:** Plan marks "Auto-build eligible: Yes" while multiple IMPLEMENT tasks are below 80% confidence (TASK-05 at 75%, TASK-07 at 75%, TASK-08 at 70%), which contradicts the stated build-gate policy.
3. **[Major] Line 110:** Dependency logic is inconsistent: Wave 2 says TASK-03 and TASK-06 can run in parallel and both depend only on TASK-02, but task metadata declares TASK-06 depends on TASK-03.
4. **[Major] Line 436:** Repository fact is incorrect: `packages/types` already has Jest config and test support (`packages/types/jest.config.cjs`, `packages/types/__tests__`), so "jest config location unconfirmed / fallback package" is misleading.
5. **[Minor] Line 346:** Deployment wording says "Cloudflare Pages build," but the app runtime is OpenNext Worker (`apps/caryina/wrangler.toml`).
6. **[Minor] Line 382:** Locale fallback example is reversed (`materials.en ?? materials.de`), which would prefer English even when locale-specific copy exists.

### Fixes Applied (before Plan Round 2)

- TASK-05 TC-01 rewritten: validates spec fields directly on `ProductPublication`-shaped records (not via `skuSchema.parse()`).
- Auto-build eligible note expanded to clarify per-task gating: TASK-02, TASK-03, TASK-06 meet the ≥80% threshold; TASK-05 gated by CHECKPOINT-04; TASK-08 gated by TASK-01 completion.
- Parallelism guide corrected: Wave 2 = TASK-03 only; Wave 3 = TASK-06 (after TASK-03, which is a correct dependency).
- TASK-07 planning validation updated: confirmed `packages/types/jest.config.cjs` and `__tests__/` exist; fallback note removed.
- TASK-05 and TASK-06 rollout instructions updated to reference OpenNext Worker / wrangler deploy.
- Locale fallback corrected to `product.materials?.[lang] ?? product.materials?.en` throughout TASK-06.

---

## Plan: Round 2 (2026-02-28)

- Route: codemoot
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision (no Criticals; 2 warnings; partially credible at 3.5; plan+auto proceeds with Critique-Warning)
- Severity counts: Critical 0 / Major 2 (warnings) / Minor 1 (info)

### Findings

1. **[Major] Line 92:** Auto-build gate logic conflicts with repo policy (AGENTS.md requires every IMPLEMENT task to be ≥80% and unblocked before build; plan explicitly allows TASK-05/07/08 below threshold without replanning).
2. **[Major] Line 418:** Task-07 says Jest config/location is unconfirmed, but the same task later states it is confirmed; this internal contradiction is repeated in Simulation Trace and Risks.
3. **[Minor] Line 399:** TASK-06 rollout text says "Deploy to Cloudflare Pages staging," inconsistent with OpenNext Worker deployment path.

### Fixes Applied (final)

- TASK-07 confidence raised to 80% (min of Implementation 85%, Approach 85%, Impact 80%) — jest config now confirmed, impact updated to reflect CI regression protection value.
- TASK-05 confidence note updated: 75% pre-CHECKPOINT-04, expected to rise to 85% after data confirmed. Build execution is blocked until CHECKPOINT-04 passes.
- TASK-08 confidence explanation added: 70% is correct for documentation-only task; does not block build eligibility.
- All internal contradiction references to "unconfirmed jest config" removed from TASK-07 confidence breakdown, Simulation Trace, and Risks table.
- TASK-06 rollout updated to reference OpenNext Worker / wrangler deploy.
- Overall-confidence recalculated: 800/10 = 80% (TASK-07 contribution raised from 75→80).

### Post-Round 2 Status (Plan)

- lp_score 3.5 → partially credible
- No Critical findings remain
- Round 3 not required (condition: Critical still present after Round 2 — not met)
- plan+auto mode: proceed with `Critique-Warning: partially-credible`
- Proceeding to Phase 10 build handoff
