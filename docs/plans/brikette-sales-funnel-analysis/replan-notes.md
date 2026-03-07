---
Replan-round: 4
Date: 2026-03-07
Plan: docs/plans/brikette-sales-funnel-analysis/plan.md
---

# Replan Notes

## Round 1 — 2026-03-01

### Target

- `TASK-11` (`IMPLEMENT`, confidence floor 80%)

### Evidence Added

1. `TASK-10` readiness artifact already fixes scope to email-only and identifies compliance boundaries.
2. Existing booking-state and handoff contracts from TASK-04/TASK-07A provide stable inputs for recovery payload and audience proxy events.
3. MVP dispatch path bounded to `mailto` (no backend coupling), reducing implementation and rollout uncertainty.

### Delta Applied

1. Raise `TASK-11` confidence from `75%` to `80%` based on bounded email-only MVP contract.
2. Keep WhatsApp/push/retargeting out of scope.
3. Add explicit artifact requirement `artifacts/recovery-runbook.md` for consent version, retention metadata, and expiry behavior.

### Remaining External Blockers

- `TASK-08` still blocked by live production canonical target `404` states outside local code changes.

## Round 2 — 2026-03-06

### Target

- `TASK-08` (`IMPLEMENT`, previously blended app SEO closure + external Cloudflare redirect convergence)

### Evidence Added

1. App-owned SEO/indexation work is already implemented and evidenced in-plan: `/book` emits `noindex,follow`, outbound handoff anchors use `rel="nofollow noopener noreferrer"`, and booking-param propagation was cleaned from internal room-detail links.
2. Redirect/canonical inventory already exists as a separate artifact in `artifacts/production-redirect-matrix.md`, so the remaining uncertainty is not about target selection inside the repo.
3. The actual unresolved blocker is external: live Cloudflare routing still leaves canonical targets such as `/book`, `/it/prenota`, `/en/dorms`, and `/it/camere-condivise` returning `404`.

### Delta Applied

1. Split blended `TASK-08` into four stable subtasks:
   - `TASK-08A` app-owned SEO/indexation closure
   - `TASK-08B` live redirect inventory and canonical target map
   - `TASK-08C` production Cloudflare redirect implementation
   - `TASK-08D` live curl verification gate
2. Mark `TASK-08A` and `TASK-08B` complete from existing evidence.
3. Leave only `TASK-08C` and `TASK-08D` blocked, making the remaining work operationally precise.
4. Narrow `TASK-12` to depend on `TASK-08D` instead of the old blended `TASK-08`.

### Sequencing Impact

1. Critical path now runs through `TASK-08A -> TASK-08B -> TASK-08C -> TASK-08D -> TASK-12`.
2. No task renumbering was performed; the split preserves the `TASK-08` family with suffix IDs.

### Remaining External Blockers

- `TASK-08C` requires access to the real production routing source of truth on Cloudflare.
- `TASK-08D` cannot run until those external redirect changes are live.

## Round 3 — 2026-03-06

### Target

- `TASK-13B` (`IMPLEMENT`, confidence already >=80 but still carrying unresolved policy ambiguity)
- `TASK-13D` (`IMPLEMENT`, confidence below `80%`)

### Evidence Added

1. The route-localization briefing already proves the debt is real and bounded: apartment booking route hardcoded in English, legal-policy slug ambiguity, room-slug English fallbacks in several locales, and `29-30/119` live guide slugs still matching English per non-English locale.
2. The remaining uncertainty inside `TASK-13B` is not route mechanics but policy intent: whether legal slugs are intentionally frozen and which shared-spelling cases belong in an explicit allowlist.
3. The remaining uncertainty inside `TASK-13D` is not whether guide debt exists but how to classify the causes and preserve legacy indexed aliases safely.

### Delta Applied

1. Added `TASK-13F` as an explicit precursor `INVESTIGATE` task for top-level slug policy, allowlist, and the apartment-route consumer map.
2. Added `TASK-13G` as an explicit precursor `INVESTIGATE` task for guide fallback causes and alias-preservation strategy.
3. Updated `TASK-13B` to depend on `TASK-13F` and removed its inline scout ambiguity.
4. Updated `TASK-13D` to depend on `TASK-13G`, removed its inline scout ambiguity, and raised confidence from `75%` to `80%` because the unknown now has a formal precursor chain.
5. Re-sequenced the route-localization tranche to `TASK-13A -> (TASK-13F, TASK-13C, TASK-13G) -> (TASK-13B, TASK-13D) -> TASK-13E`.

### Sequencing Impact

1. `TASK-13A` remains the first runnable build task in the route-localization tranche.
2. `TASK-13B` is no longer allowed to begin until top-level policy and apartment-route consumers are frozen by `TASK-13F`.
3. `TASK-13D` is no longer allowed to begin until guide fallback causes and alias strategy are frozen by `TASK-13G`.
4. `TASK-08C` still remains externally blocked, but now waits on a cleaner and more defensible localized target contract.

### Readiness Decision

- Partially ready.
  - Completed on 2026-03-06 / 2026-03-07: `TASK-13A`, `TASK-13F`, `TASK-13B`, `TASK-13C`, `TASK-13G`, `TASK-13D`, `TASK-13E`
  - Runnable now: `TASK-08C` (external source-of-truth change required)
  - Still blocked externally: `TASK-08C`, `TASK-08D`

## Round 4 — 2026-03-07

### Target

- `TASK-08C` (`IMPLEMENT`, external rollout task no longer aligned with the best long-term routing strategy)

### Evidence Added

1. Direct staging deployment on `2026-03-07` proved the localized canonical pages themselves are healthy, but later alias families such as `/it/book`, `/it/book-private-accommodations`, `/it/help/how-to-reach-positano-on-a-budget`, and `/ja/about` still returned `404`.
2. The deployed `_redirects` artifact contains `4016` static and `601` dynamic rules, which exceeds Cloudflare Pages documented `_redirects` limits (`2000` static, `100` dynamic).
3. The repo already contains a durable public-history boundary in `apps/brikette/src/test/fixtures/legacy-urls.txt` (`3435` URLs), which is a better support contract than preserving every generated alias.
4. Static export normalization removes many non-English internal-path duplicates from the deploy artifact, so `listAppRouterUrls()` is not a valid proxy for public-runtime coverage.

### Delta Applied

1. Added `TASK-14A` as a policy/evidence task to freeze the supported legacy URL contract and explicitly drop synthetic wrong-locale alias debt.
2. Added `TASK-14B` as the new runnable implementation tranche for a hybrid static-runtime redirect model:
   - small structural `_redirects`
   - generated exact-alias manifest
   - Pages Function resolution for high-cardinality historical room/guide/article aliases
3. Updated `TASK-08C` to depend on `TASK-14B` instead of going straight from `TASK-13E` to live rollout.
4. Kept `TASK-08D` as the live verification gate after the rollout task.

### Sequencing Impact

1. The critical path is now `TASK-13E -> TASK-14A -> TASK-14B -> TASK-08C -> TASK-08D -> TASK-12`.
2. The next runnable local build task is `TASK-14B`.
3. `TASK-08C` remains an external rollout step, but only after the local redirect model has been corrected.

### Readiness Decision

- Ready.
  - Completed by this replan: `TASK-14A`
  - Runnable now: `TASK-14B`
  - Still blocked externally after local implementation: `TASK-08C`, `TASK-08D`
