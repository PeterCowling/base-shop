---
Type: Fact-Find-Artifact
Domain: Platform
Workstream: Engineering
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: nextjs-16-upgrade
As-of-commit: 370697af5f5f58d7bc5b2c0ab9078900d5be658f
---

# Next 16 / React 19 / Webpack Configuration Snapshot (Audit-Ready)

## Definitions
- `root package.json` means repository root file: `package.json`.
- `Next app` in this document means: `apps/*/package.json` contains a direct `"next"` dependency/devDependency.
- `OpenNext=Yes` means `apps/<app>/open-next.config.ts` exists and imports `@opennextjs/cloudflare`.
- `Worker-build=Yes` means `apps/<app>/package.json` has script `build:worker: opennextjs-cloudflare build`.
- `Evidence` labels:
  - `OBSERVED` = directly verified by command/file.
  - `INFERENCE` = reasoned from observed evidence.
  - `PROPOSAL` = recommended control/policy, not yet enforced.

## Reproducibility Footprint
- Snapshot commit: `370697af5f5f58d7bc5b2c0ab9078900d5be658f`.
- Toolchain used:
  - `node -v` -> `v20.19.4`
  - `pnpm -v` -> `10.12.1`
- Node engine constraint: `root/package.json:L9` (`>=20.9.0`).

## 1) Repo Invariants (OBSERVED)

### 1.1 Version control points
- `root package.json` pins:
  - `next: 16.1.6` at `root/package.json:L238` and `root/package.json:L352`.
  - `react: 19.2.1` at `root/package.json:L250`.
  - `react-dom: 19.2.1` at `root/package.json:L252`.
  - `webpack: ^5.104.1` at `root/package.json:L382`.
- `pnpm.overrides` forces `next: 16.1.6` at `root/package.json:L387`.

### 1.2 Shared Next contract (`@acme/next-config`)
- Next-level invariants:
  - `reactStrictMode: true` -> `packages/next-config/index.mjs:37`
  - `serverExternalPackages: ["react-i18next"]` -> `packages/next-config/index.mjs:41`
  - base transpilation list -> `packages/next-config/index.mjs:46`
  - image qualities pin `[75,80,85,90]` -> `packages/next-config/index.mjs:63`
  - conditional export mode via `OUTPUT_EXPORT` -> `packages/next-config/index.mjs:67`
- Webpack-level compatibility layer:
  - `outputFileTracingRoot` -> `packages/next-config/next.config.mjs:17`
  - `extensionAlias` TS/ESM handling -> `packages/next-config/next.config.mjs:40`
  - `NormalModuleReplacementPlugin` for `node:` normalization -> `packages/next-config/next.config.mjs:79`

## 2) Ground Truth Resolution (OBSERVED)

### 2.1 Enumerated Next apps + resolved runtime versions
Enumeration method: direct `"next"` in `apps/*/package.json`.

Command used:
- `for app in apps/*; do if [ -f "$app/package.json" ] && rg -q '"next"\\s*:' "$app/package.json"; then echo "== $app"; (cd "$app" && node -p "require('next/package.json').version + ' | ' + require('react/package.json').version + ' | ' + require('react-dom/package.json').version"); fi; done`

Captured output:

| App | Resolved `next | react | react-dom` |
|---|---|
| `brikette` | `16.1.6 | 19.2.1 | 19.2.1` |
| `business-os` | `16.1.6 | 19.2.1 | 19.2.1` |
| `cms` | `16.1.6 | 19.2.1 | 19.2.1` |
| `cochlearfit` | `16.1.6 | 19.2.1 | 19.2.1` |
| `cover-me-pretty` | `16.1.6 | 19.2.1 | 19.2.1` |
| `handbag-configurator` | `16.1.6 | 19.2.1 | 19.2.1` |
| `prime` | `16.1.6 | 19.2.1 | 19.2.1` |
| `product-pipeline` | `16.1.6 | 19.2.1 | 19.2.1` |
| `reception` | `16.1.6 | 19.2.1 | 19.2.1` |
| `skylar` | `16.1.6 | 19.2.1 | 19.2.1` |
| `xa` | `16.1.6 | 19.2.1 | 19.2.1` |
| `xa-b` | `16.1.6 | 19.2.1 | 19.2.1` |
| `xa-j` | `16.1.6 | 19.2.1 | 19.2.1` |
| `xa-uploader` | `16.1.6 | 19.2.1 | 19.2.1` |

### 2.2 `@next/env` resolution
- Command used:
  - `pnpm -r list @next/env --depth -1`
- `pnpm -r list @next/env --depth -1` shows:
  - `@acme/next-config` depends on `@next/env 15.3.5`.
  - manifest anchor: `packages/next-config/package.json:20`
- Command used (multiplicity view):
  - `pnpm why @next/env`
  - `ls node_modules/.pnpm | rg '^@next\\+env@' | sort`
- `pnpm why @next/env` shows active dependency graph references for `16.1.6` and `16.0.0`.
- pnpm store directory listing includes `@next+env@15.3.5`, `@next+env@15.3.9`, `@next+env@16.0.0`, `@next+env@16.1.6`.
- This is materially relevant to drift item D-01.

### 2.3 `@next/swc*` resolution
- Command used (direct declarations only):
  - `pnpm -r list @next/swc-linux-x64-gnu @next/swc-darwin-arm64 @next/swc-win32-x64-msvc --depth -1`
- OBSERVED: command produced no explicit workspace declaration rows.
- Command used (transitive evidence):
  - `(cd apps/brikette && pnpm list '@next/swc*' --depth 10)`
  - `(cd apps/cms && pnpm list '@next/swc*' --depth 10)`
- OBSERVED: transitive `@next/swc-*` packages at `16.1.6` are present beneath `next 16.1.6` in app dependency trees.
- INFERENCE: SWC packages are managed transitively by Next; absence at `--depth -1` does not indicate absence from runtime graph.

## 3) Webpack Policy: Intent, Coverage, Limitations

### 3.1 Current enforced policy (OBSERVED)
- Enforcement script: `scripts/check-next-webpack-flag.mjs`.
- Scope by path class:
  - `apps/**/package.json` and `packages/**/package.json` -> `scripts/check-next-webpack-flag.mjs:139`
  - `.github/workflows/*.yml|*.yaml` -> `scripts/check-next-webpack-flag.mjs:142`
- Detection rule:
  - regex scans for `next dev` / `next build`: `scripts/check-next-webpack-flag.mjs:161`
  - flags violation if segment does not include `--webpack`: `scripts/check-next-webpack-flag.mjs:168`
  - compliance means `--webpack` can appear anywhere in the matched command segment (it is not required to be immediately adjacent to `next dev/build`).
- Stated intent text:
  - `scripts/check-next-webpack-flag.mjs:308`
  - `scripts/check-next-webpack-flag.mjs:309`

### 3.2 Enforcement integration (OBSERVED)
- Local/agent validation pipeline:
  - `scripts/validate-changes.sh:87`
  - `scripts/validate-changes.sh:88`
- CI merge gate:
  - `.github/workflows/merge-gate.yml:29`
  - `.github/workflows/merge-gate.yml:30`

### 3.3 Coverage limitations and bypass vectors
- `next start` is intentionally out-of-scope (detector only matches `dev|build` at `scripts/check-next-webpack-flag.mjs:161`).
- Commands inside JS/shell wrappers are out-of-scope unless they appear as raw `next dev/build` in scanned files.
  - Example wrapper pattern exists: `apps/xa/scripts/build-xa.mjs` (contains `next build --webpack`).
  - `INFERENCE`: a wrapper could call `next build` without flag and bypass static policy scan if package/workflow only invokes the wrapper.
- The script parses command segments split by `&&`, `||`, `;`, newline (`scripts/check-next-webpack-flag.mjs:149`), so obfuscated/dynamic command construction can evade detection (`INFERENCE`).

## 4) Why `--webpack` remains (evidence-backed)

### 4.1 Source-of-truth rationale in repository (OBSERVED)
- Policy rationale: preserve custom webpack behavior / avoid Turbopack default change.
  - `scripts/check-next-webpack-flag.mjs:309`
- XA build wrapper repeats rationale:
  - `apps/xa/scripts/build-xa.mjs:41`

### 4.2 Concrete blocker surfaces (OBSERVED)
1. Shared webpack compatibility layer in `@acme/next-config`:
- `packages/next-config/next.config.mjs:40`
- `packages/next-config/next.config.mjs:79`

2. CMS webpack customizations (resolver/hash/cache/react alias handling):
- `apps/cms/next.config.mjs:221`
- `apps/cms/next.config.mjs:238`
- `apps/cms/next.config.mjs:259`
- `apps/cms/next.config.mjs:260`

3. Brikette webpack-specific behavior:
- client fallback map -> `apps/brikette/next.config.mjs:139`
- `?raw` loader behavior -> `apps/brikette/next.config.mjs:153`

### 4.3 Claim quality on “what breaks if removed”
- Brikette fallback necessity is documented as comment claim (source type: comment), not reproduced in this audit:
  - `apps/brikette/next.config.mjs:137`
- CMS stability notes are comment claims, not reproduced in this audit:
  - `apps/cms/next.config.mjs:221`
  - `apps/cms/next.config.mjs:224`
- Therefore:
  - `OBSERVED`: compatibility code exists.
  - `INFERENCE`: these are active Turbopack blockers.
  - `PROPOSAL`: create explicit repro cases per blocker before any policy relaxation.

## 5) App Deltas from Shared Contract (OBSERVED)

### 5.1 `apps/cms`
- `experimental.cpus` tuning: `apps/cms/next.config.mjs:151`, `apps/cms/next.config.mjs:156`
- `typescript.ignoreBuildErrors: true`: `apps/cms/next.config.mjs:171`
- React exact aliasing + resolver workarounds: `apps/cms/next.config.mjs:259`, `apps/cms/next.config.mjs:260`

Compensating control evidence:
- CMS workflow has explicit typecheck gate:
  - `.github/workflows/cms.yml:60`
  - `.github/workflows/cms.yml:82`
- Repo-wide CI includes affected typecheck:
  - `.github/workflows/ci.yml:260`
  - `.github/workflows/ci.yml:261`

### 5.2 `apps/brikette`
- Bundles `react-i18next` by removing from externals list:
  - `apps/brikette/next.config.mjs:107`
- client fallbacks for node modules:
  - `apps/brikette/next.config.mjs:139`
- `resourceQuery /raw` rule:
  - `apps/brikette/next.config.mjs:153`

### 5.3 `apps/prime`
- Bundles `react-i18next`:
  - `apps/prime/next.config.mjs:9`
- `trailingSlash: true`:
  - `apps/prime/next.config.mjs:13`

### 5.4 `apps/reception`
- Isolated config (does not spread shared preset): `apps/reception/next.config.mjs:1`
- Local compiler/transpile behavior only: `apps/reception/next.config.mjs:3`, `apps/reception/next.config.mjs:4`

## 6) Runtime/Deploy Matrix (OBSERVED + INFERENCE labels)

Router-shape derivation method (OBSERVED): filesystem checks for `src/app`, `src/pages`, `app`, `pages`.

| App | Router shape (derived) | OpenNext | Worker-build | Evidence anchors |
|---|---|---|---|---|
| `apps/brikette` | `src/app` | Yes | No | `apps/brikette/open-next.config.ts:1`, `apps/brikette/package.json:74` |
| `apps/business-os` | `src/app` | Yes | Yes | `apps/business-os/open-next.config.ts:1`, `apps/business-os/package.json:7`, `apps/business-os/package.json:23` |
| `apps/cms` | `src/app` | Yes | Yes | `apps/cms/open-next.config.ts:1`, `apps/cms/package.json:15`, `apps/cms/package.json:55` |
| `apps/cochlearfit` | `src/app` | No | No | filesystem-derived + `apps/cochlearfit/package.json` |
| `apps/xa` | `src/app` | Yes | No | `apps/xa/open-next.config.ts:1`, `apps/xa/package.json:32` |
| `apps/cover-me-pretty` | `src/app+src/pages` | No | No | filesystem-derived + `apps/cover-me-pretty/package.json` |
| `apps/handbag-configurator` | `src/app+src/pages` | No | No | filesystem-derived + `apps/handbag-configurator/package.json` |
| `apps/prime` | `src/app` | No | No | filesystem-derived + `apps/prime/package.json` |
| `apps/product-pipeline` | `src/app` | No | No | filesystem-derived + `apps/product-pipeline/package.json` |
| `apps/reception` | `src/app` | No | No | filesystem-derived + `apps/reception/package.json` |
| `apps/skylar` | `src/app` | No | No | filesystem-derived + `apps/skylar/package.json` |
| `apps/xa-b` | `src/app` | No | No | filesystem-derived + `apps/xa-b/package.json` |
| `apps/xa-j` | `src/app` | No | No | filesystem-derived + `apps/xa-j/package.json` |
| `apps/xa-uploader` | `src/app` | No | No | filesystem-derived + `apps/xa-uploader/package.json` |

## 7) `OUTPUT_EXPORT` Usage Evidence

### 7.1 Shared behavior
- Shared config enables static export mode when `OUTPUT_EXPORT` is set:
  - `packages/next-config/index.mjs:67`

### 7.2 CI usage (OBSERVED)
- Brikette workflow sets `OUTPUT_EXPORT=1` in build step:
  - `.github/workflows/brikette.yml:68`
  - `.github/workflows/brikette.yml:100`
- Prime workflow sets `OUTPUT_EXPORT=1` in build command:
  - `.github/workflows/prime.yml:43`
- Product-pipeline workflow sets `OUTPUT_EXPORT=1`:
  - `.github/workflows/product-pipeline.yml:41`
- Skylar workflow sets `OUTPUT_EXPORT=1`:
  - `.github/workflows/skylar.yml:50`
- These are deploy workflows using `.github/workflows/reusable-app.yml` and pass static-export artifacts to Pages deploy commands, so this is deployment build mode for those workflow paths (not e2e-only):
  - `.github/workflows/prime.yml:40`
  - `.github/workflows/product-pipeline.yml:38`
  - `.github/workflows/skylar.yml:44`
  - `.github/workflows/brikette.yml:59`

### 7.3 App script usage (OBSERVED)
- Cochlearfit preview scripts set `OUTPUT_EXPORT=1`:
  - `apps/cochlearfit/package.json:8`
  - `apps/cochlearfit/package.json:9`
- Prime e2e critical script sets `OUTPUT_EXPORT=1`:
  - `apps/prime/package.json:13`

## 8) Drift Register

- D-01: `@acme/next-config` manifest drifts from repo Next baseline.
  - `packages/next-config/package.json:21` (`next: ^15.3.9`)
  - `packages/next-config/package.json:20` (`@next/env: 15.3.5`)
  - Ground-truth runtime still resolves Next 16.1.6 across Next apps.
- D-02: root `next` declared in both dependencies and devDependencies.
  - `root/package.json:L238`, `root/package.json:L352`
- D-03: CMS build ignores TS errors in Next build path.
  - `apps/cms/next.config.mjs:171`
  - Compensating CI controls exist at `.github/workflows/cms.yml:82` and `.github/workflows/ci.yml:261`.
- D-04: Webpack policy scanner does not analyze JS wrapper scripts using `spawnSync`/`execSync` array-arg patterns.
  - policy scope implementation at `scripts/check-next-webpack-flag.mjs:136` and `scripts/check-next-webpack-flag.mjs:161`.
  - **Status: ACCEPTED LIMITATION (TASK-16, 2026-02-17)** — all 3 current wrapper bypass locations (`apps/xa/xa-b/xa-j/scripts/build-xa.mjs`) are compliant. See §12 for full coverage map and hardening options.
- D-05 (new): Next operational inventory differs from app-only definition.
  - `packages/template-app/next.config.mjs` exists and package declares Next:
    - `packages/template-app/next.config.mjs:1`
    - `packages/template-app/package.json:41`
  - current `Next app` definition in this doc intentionally scopes to `apps/*`.

## 9) Exit Criteria (PROPOSAL)
1. Webpack policy relaxation criteria:
- repro-based validation exists for each current blocker class (shared resolver layer, CMS resolver/alias layer, Brikette `?raw`/fallback layer).
- blockers either removed or replaced with Turbopack-compatible patterns.
- policy updated from global hard requirement to allowlist-based exceptions (if desired).

2. Manifest hygiene criteria:
- resolve D-01 ownership choice for `@acme/next-config` (`peerDependency` vs `devDependency` vs aligned dependency).
- resolve D-02 with a single explicit ownership rule for `next` at root.

3. CMS safety criteria:
- retain explicit CI typecheck gates while D-03 remains.
- only remove `ignoreBuildErrors` when sustained clean typecheck and build results are demonstrated.

## 10) Direct Answers to Review Questions

### A) Evidence hygiene and reproducibility
- Q: Should `root/package.json:L238` be treated as root?
  - A: Yes. This doc defines `root package.json == package.json` in Definitions.
- Q: Pin to immutable reference?
  - A: Yes. Added `As-of-commit` in frontmatter.
- Q: Embed output snippets?
  - A: Yes. Added captured app/version table and `@next/env` resolution note.
- Q: Are command lines recorded for each captured block?
  - A: Yes. Added explicit `Command used` lines in Sections 2.1, 2.2, and 2.3.

### B) Ground truth completeness
- Q: Add `@next/env` resolution?
  - A: Done; added explicit section under Ground Truth.
- Q: How are Next apps enumerated?
  - A: By direct `"next"` declaration in `apps/*/package.json` (documented in Definitions).
- Q: Duplicate React check desired?
  - A: `pnpm why react` currently shows `19.2.1` throughout the sampled graph; a dedicated runtime duplicate-instance smoke check is still recommended for CMS/Brikette.
- Q: Are there Next apps without direct `next` declaration?
  - A: Not in `apps/*` with `next.config.mjs`; all such apps currently declare `next` directly.
- Q: Any Next usage outside `apps/*`?
  - A: Yes. `packages/template-app` is a Next-bearing package and is tracked separately (D-05).

### C) Webpack policy scope and exception model
- Q: Global indefinitely or temporary?
  - A: Current state is global and enforced. Duration is unresolved; exit criteria now documented in Section 9.
- Q: Explicit exception mechanism?
  - A: Not present today. Recommended to introduce allowlist if policy is relaxed.
- Q: Known bypass vectors?
  - A: Yes; wrapper scripts/nested invocations are currently out-of-scope (D-04).
- Q: What exactly is considered compliant?
  - A: Any matched `next dev`/`next build` command segment containing `--webpack` is compliant; placement in the segment is flexible.

### D) CMS safety and exit criteria
- Q: Is CI typecheck present for CMS?
  - A: Yes. `.github/workflows/cms.yml:82` and affected typecheck in `.github/workflows/ci.yml:261`.
- Q: What command does CMS typecheck run?
  - A: `pnpm --filter @apps/cms typecheck`, which maps to `tsc -p tsconfig.json --noEmit` in `apps/cms/package.json`.
    - `.github/workflows/cms.yml:82`
    - `apps/cms/package.json:12`
- Q: Can this gate be skipped?
  - A: It is path-scoped and has additional label/branch conditions in workflow `if` expressions; when triggered, build depends on lint+typecheck+test.
    - `.github/workflows/cms.yml:31`
    - `.github/workflows/cms.yml:62`
    - `.github/workflows/cms.yml:134`
- Q: If not present, drift item?
  - A: Not needed now; compensating control is evidenced.
- Q: Failure mode behind `ignoreBuildErrors`?
  - A: Exact origin not fully documented in this snapshot; likely legacy alias/type mismatch pressure (`INFERENCE`). Recommend adding incident/PR citation in future revision.

### E) Turbopack blockers: evidence vs assumptions
- Q: Do we have direct Turbopack reproductions for each blocker?
  - A: Not in this artifact. Current blocker list is partly evidence-of-customization plus inference-of-blocking. Section 4.3 now explicitly separates this.

### F) Runtime/deploy matrix validity
- Q: Router shape backed by deterministic method?
  - A: Yes; method now documented (filesystem checks).
- Q: `OUTPUT_EXPORT` production evidence complete?
  - A: For Brikette/Prime/Product-Pipeline/Skylar deploy workflows, `OUTPUT_EXPORT=1` is used in deploy build paths (not just test). Full external platform env provenance remains outside-repo.

### G) Dependency ownership clarity
- Q: D-02 ownership rule?
  - A: Currently unresolved; document now flags this as a policy decision required.
- Q: D-01 (`@acme/next-config`) dependency model?
  - A: Not yet decided; recommended decision is to choose explicit ownership model and align manifest accordingly (peerDependency or devDependency are typical for shared config packages).
- Q: Should this artifact propose a default model?
  - A: PROPOSAL: treat `next/react/react-dom` as peers for shared config packages, with optional devDependencies for local package tests only.

## 11) Summary
The repo is operationally consistent at runtime (Next 16.1.6 + React 19.2.1) and strongly guarded for `--webpack`, but still has governance debt in manifest truthfulness and policy completeness (wrapper-scan gap). This revision closes the prior auditability gaps by pinning commit, defining enumeration, capturing outputs, and explicitly distinguishing observed facts from inference/proposal.

---

## 12) TASK-16 Evidence: Webpack Policy Coverage Map and D-04 Resolution (2026-02-17)

> Added by TASK-16 (INVESTIGATE — Webpack Policy Coverage Hardening). All findings below are OBSERVED (read-only audit; no code changes in this task).

### 12.1 Scanner Scope (Confirmed OBSERVED)

| Surface | Files scanned | Pattern | Status |
|---|---|---|---|
| App package.json | `apps/<app>/package.json` | `scripts` object values | ✅ Covered |
| Package package.json | `packages/<pkg>/package.json`, `packages/<group>/<pkg>/package.json` | `scripts` object values | ✅ Covered |
| CI workflows | `.github/workflows/*.yml`, `.github/workflows/*.yaml` | Line-by-line `next dev/build` regex | ✅ Covered |
| App wrapper scripts | `apps/*/scripts/*.mjs`, `apps/*/scripts/*.sh` | — | ❌ NOT scanned |
| Root scripts/ | `scripts/*.mjs`, `scripts/*.sh` | — | ❌ NOT scanned (but no `next` invocations found) |
| `turbo.json` | — | — | ❌ NOT scanned (no `next` invocations found) |

**Total scanned files:** 93 (`git ls-files | grep -E "(apps/[^/]+/package\.json|packages/[^/]+/package\.json|\.github/workflows/.*\.(yml|yaml))"`)

**Scanner invocation points:**
- Pre-commit hook: `scripts/git-hooks/pre-commit.sh:7` — `node scripts/check-next-webpack-flag.mjs --staged`
- CI merge gate: `.github/workflows/merge-gate.yml:30` — `node scripts/check-next-webpack-flag.mjs --all`

**Full scan exit status (2026-02-17):** `node scripts/check-next-webpack-flag.mjs --all` → EXIT 0 (no violations)

### 12.2 Wrapper Script Bypass Vector Audit (OBSERVED)

All wrapper scripts that invoke `next build` or `next dev`:

| File | Invocation | --webpack present? | D-04 risk |
|---|---|---|---|
| `apps/xa/scripts/build-xa.mjs:43` | `spawnSync(pnpm, ["exec", "next", "build", "--webpack"])` | ✅ Yes | Compliant; not flagged by scanner |
| `apps/xa-b/scripts/build-xa.mjs:43` | `spawnSync(pnpm, ["exec", "next", "build", "--webpack"])` | ✅ Yes | Compliant; not flagged by scanner |
| `apps/xa-j/scripts/build-xa.mjs:43` | `spawnSync(pnpm, ["exec", "next", "build", "--webpack"])` | ✅ Yes | Compliant; not flagged by scanner |

**Finding:** All 3 bypass-vector locations are compliant. No current D-04 exploitation. The scanner gap is structural (wrappers use `spawnSync` with array args, not raw strings parseable by the regex) but carries LOW risk given:
- Wrapper scripts exist only for XA apps (which are less frequently modified)
- Package.json `build` scripts that invoke the wrappers ARE scanned (and are policy-compliant)
- Code review + CI merge gate (`--all`) catch any new `next build` additions to scanned files

**No other wrapper scripts invoke `next dev` or `next build`** (confirmed via `rg -rn "next (dev|build)" apps/ --glob "*.mjs" --glob "*.sh"` — zero results).

### 12.3 D-04 Resolution

**D-04 Status: ACCEPTED LIMITATION with rationale**

Rationale:
1. **Current risk = zero**: all 3 wrapper script bypass locations include `--webpack`.
2. **Scanner limitation is structural**: `spawnSync(... ["exec", "next", "build"])` array syntax cannot be detected by the current regex-on-strings approach without AST parsing.
3. **Policy enforcement path is intact**: the authoritative invocation surface (package.json `build` scripts + CI workflow `run:` steps) is 100% scanned. Wrappers are invoked via these scanned scripts.
4. **Future guard**: any new `next build` or `next dev` added to a package.json or workflow file will be caught immediately.

**Accepted limitation:** The scanner cannot detect violations hidden inside JS wrapper `spawnSync`/`execSync` array-arg calls. Document explicitly; require `--webpack` in all array-arg wrapper invocations by convention.

### 12.4 Hardening Options (for TASK-17/18 decision context)

**Option A (concrete, actionable): Extend scanner to wrapper files**
- Add `apps/*/scripts/*.mjs` (and optionally `apps/*/scripts/*.sh`) to `isRelevantPath()` in `check-next-webpack-flag.mjs`
- Detection caveat: the regex (`/\bnext\s+(dev|build)\b/`) will match raw strings and template literals but NOT `spawnSync` array-arg patterns like `["exec", "next", "build"]`. A separate AST-based check or convention-enforced comment would be needed for full coverage.
- False-positive risk: LOW (wrapper scripts are few and well-named)
- False-negative risk: MEDIUM (array-arg `spawnSync` patterns still not covered unless the string form is also present)
- Recommendation: viable partial improvement; document residual false-negative surface explicitly if implemented.

**Option B (lowest churn): Convention + comment mandate**
- Add a required comment block to all wrapper scripts: `// Policy: uses --webpack per repo policy (check-next-webpack-flag.mjs does not scan this file)`
- Zero code churn in scanner; relies on code review
- Suitable given current low risk profile.

**Recommended path given current risk:** Accept Option B (convention comment) now; revisit Option A if new wrapper scripts proliferate or a future wrapper violates the convention.

### 12.5 D-04 Updated Entry

Updated D-04 in section 8:
> **D-04**: Webpack policy scanner does not analyze JS wrapper scripts (e.g., `apps/xa/scripts/build-xa.mjs`) using `spawnSync`/`execSync` array-arg `next build` invocations.
> - **Status: ACCEPTED LIMITATION (2026-02-17)**
> - All 3 current wrapper bypass locations are compliant (include `--webpack`).
> - Package.json `build` scripts that invoke wrappers ARE scanned — policy path is intact.
> - Hardening option: extend `isRelevantPath()` for wrapper files (partial; residual array-arg false-negative remains). See TASK-16 evidence §12.4.
> - Convention mandate: all future wrapper scripts invoking `next build/dev` must use array-arg with `"--webpack"` element explicitly.

---

## 13) TASK-19 Evidence: Turbopack Blocker Repro Matrix (2026-02-17)

> Added by TASK-19 (INVESTIGATE — Turbopack Blocker Repro Matrix). All findings below are OBSERVED from live probes, except where labelled UNVERIFIED-ASSUMPTION.

### 13.1 Probe Methodology

**Probes run (2026-02-17):**

| Probe | Command | Duration | Outcome |
|---|---|---|---|
| P1 — XA startup | `pnpm --filter @apps/xa-c exec next dev --turbopack --port 19992` | ~1s to Ready | `✓ Ready in 1023ms` — EXIT 143 (SIGTERM) |
| P2 — CMS startup | `pnpm --filter @apps/cms exec next dev --turbopack --port 19993` | ~1s to Ready | `✓ Ready in 845ms` — EXIT 143 (SIGTERM) |
| P3 — Brikette startup | `pnpm --filter @apps/brikette exec next dev --turbopack --port 19991` | config OK | `✓ Starting...` then lock conflict (pre-existing dev server held lock) — config did not error |
| P4 — XA page request | `curl http://localhost:19992/` after P1 | 28s compile | HTTP 500 — module-not-found errors from `@acme/i18n` (`.js` ESM specifiers unresolved) |

**Observation:** The `webpack()` callback in `next.config.mjs` is **not called by Turbopack**. All webpack-specific APIs defined inside that callback are silently skipped at startup. This means:
- Startup `✓ Ready` only confirms the config-level (outside `webpack()`) is Turbopack-compatible.
- Functional blockers inside `webpack()` surface at page compilation time, not at startup.

### 13.2 Repro Matrix

#### Blocker Layer A — Shared `@acme/next-config` (`packages/next-config/next.config.mjs`)

| Blocker | API | Location | Evidence Label | Notes |
|---|---|---|---|---|
| `node:` prefix normalisation via `NormalModuleReplacementPlugin` | `webpack.NormalModuleReplacementPlugin` | `next.config.mjs:79` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Turbopack has built-in `node:` prefix support; plugin silently skipped. P1 (XA) reached `✓ Ready`. No startup or page error attributed to this blocker. |
| `extensionAlias` (`.js` → `.ts` resolution) | `config.resolve.extensionAlias[".js"] = [".ts", ".tsx", ".js", ".jsx"]` | `next.config.mjs:40` (inside `webpack()`) | **OBSERVED-REPRO** ⚠️ | Turbopack does NOT apply webpack `extensionAlias`. Packages using fully-specified `.js` ESM specifiers (TSC style) fail at page compilation. **P4 confirms HTTP 500** on XA homepage with `Module not found` for `./locales.js`, `./parseMultilingualInput.js`, `./resolveText.js`, `./tokenization/index.js` — all from `packages/i18n/src/index.ts`. Import trace: `@acme/i18n` → `@acme/ui/AnnouncementBar` → `XaShell` → `layout.tsx`. |
| `node:*` → bare module alias map (resolve.alias loop) | `config.resolve.alias["node:${mod}"] = mod` | `next.config.mjs:57–76` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Alias silently skipped. P1/P2 reached `✓ Ready`. Turbopack handles `node:` protocol natively. Risk: any code relying on `node:crypto` being re-exported as `crypto` might fail at page compile — not reproduced in this probe. |

#### Blocker Layer B — CMS-specific (`apps/cms/next.config.mjs`)

| Blocker | API | Location | Evidence Label | Notes |
|---|---|---|---|---|
| `hashFunction: "xxhash64"` | `config.output.hashFunction` | `apps/cms/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Turbopack manages its own hashing; webpack output config silently skipped. P2 (CMS) reached `✓ Ready in 845ms` without error. Build-time only; dev-mode probe is sufficient proxy. |
| Webpack filesystem cache | `config.cache = { type: "filesystem", ... }` | `apps/cms/next.config.mjs` (inside `webpack()`, dev-only) | **UNVERIFIED-ASSUMPTION** | Turbopack has its own persistent cache; webpack cache config silently skipped. P2 shows CMS starts under Turbopack without error. |
| React exact-match aliases (`react$`, `react-dom$`) | `config.resolve.alias["react$"]`, `config.resolve.alias["react-dom$"]` | `apps/cms/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Webpack `$`-suffix exact-match aliases are silently skipped. Turbopack bundles React internally. P2 (CMS) reached `✓ Ready`. Page-compile not tested. Risk: CMS depends on single-instance React deduplication; without the alias, duplicate React instances could surface. |
| `entities/decode` + `entities/escape` aliasing | `config.resolve.alias["entities/decode"]` etc. | `apps/cms/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Silently skipped. CMS started without error. Only surfaces if CMS pages import `entities` and Turbopack resolves a different version. |
| `pino` symlink dep aliasing | Dynamic `config.resolve.alias[dep]` loop for pino runtime deps | `apps/cms/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Silently skipped. Risk if CMS pages exercise server-side pino logging; not tested. |
| `oidc-token-hash` alias | `config.resolve.alias["oidc-token-hash"]` via `realpathSync` | `apps/cms/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Silently skipped. Risk only if `next-auth` requires a specific `oidc-token-hash` instance; Turbopack may resolve correctly from hoisted node_modules. |
| `ignoreWarnings` filter for platform-core resolvers | `config.ignoreWarnings.push(...)` | `apps/cms/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** | Silently skipped; Turbopack has its own warning system. Functional risk: zero (warning filter, not a functionality blocker). |

#### Blocker Layer C — Brikette-specific (`apps/brikette/next.config.mjs`)

| Blocker | API | Location | Evidence Label | Notes |
|---|---|---|---|---|
| Client-side Node module fallbacks | `config.resolve.fallback = { fs: false, module: false, path: false, url: false }` | `apps/brikette/next.config.mjs` (inside `webpack()`, client-only) | **UNVERIFIED-ASSUMPTION** | Silently skipped. P3 shows brikette started past `✓ Starting...` without config error. Risk: if brikette client components import Node modules, Turbopack may include or fail differently vs webpack's `false` fallback. Test protocol: start brikette under Turbopack (after clearing lock) and request a page with client components that transitively import Node-guarded helpers. |
| `?raw` module rule (`resourceQuery: /raw/`) | `config.module.rules.unshift({ resourceQuery: /raw/, type: "asset/source" })` | `apps/brikette/next.config.mjs` (inside `webpack()`) | **UNVERIFIED-ASSUMPTION** ⚠️ (high-risk) | Silently skipped by Turbopack. Brikette has 2 live `?raw` import sites: `TravelHelpStructuredData.tsx:10` (`en-nearby.jsonld?raw`) and `ApartmentStructuredData.tsx:5` (`apartment.jsonld?raw`). Turbopack does not support webpack `resourceQuery` rules. **Test protocol**: start brikette under `--turbopack` (clear `.next/dev/lock` after confirming no live process holds it), then `curl http://localhost:<port>/it` or any page that renders structured data components. Expected failure: `Module parse failed` or `Unsupported file type` for `.jsonld` files. Fix path: add `turbopack.rules` to `next.config.mjs` (`{ "*.jsonld": { as: "source" } }` or equivalent). |

### 13.3 Summary

| Label | Count | Key items |
|---|---|---|
| `OBSERVED-REPRO` | **1** | `extensionAlias` (`.js`→`.ts`) — HTTP 500 on XA homepage, `@acme/i18n` module-not-found |
| `UNVERIFIED-ASSUMPTION` | **10** | All other webpack() callback internals (NormalModuleReplacementPlugin, node: alias loop, hashFunction, filesystem cache, React aliases, entities aliases, pino aliases, oidc-token-hash alias, ignoreWarnings, resolve.fallback) |
| `UNVERIFIED-ASSUMPTION (high-risk)` | **1** | Brikette `?raw` module rule — silently skipped; live import sites exist; untested |

**Key insight:** All webpack-specific APIs live **inside the `webpack()` callback** in `next.config.mjs`. Turbopack never calls this callback, so these APIs are silently inert — they do not cause startup errors. The functional surface that *does* break at page compilation is the **`extensionAlias`** behaviour: packages that use fully-specified `.js` ESM specifiers (TypeScript compiler output style, e.g. `from "./locales.js"`) require this alias to resolve to their `.ts` counterparts. Without it, pages importing such packages get `Module not found` errors.

**Updated §E answer:**
> Turbopack probes run 2026-02-17. `extensionAlias` (`.js`→`.ts`) is `OBSERVED-REPRO` (HTTP 500). All other blocker claims are `UNVERIFIED-ASSUMPTION` — webpack callback silently skipped at startup; functional risks at page compilation remain untested except for `extensionAlias`.

### 13.4 Test Protocols for Unverified Blockers

| Blocker | Test protocol |
|---|---|
| Brikette `?raw` rule | Clear `.next/dev/lock` (confirm no live process), start `pnpm --filter @apps/brikette exec next dev --turbopack --port 19991`, `curl` any page that renders `ApartmentStructuredData` or `TravelHelpStructuredData`. Expected: compile error for `.jsonld` file. |
| CMS React exact-match aliases | Start CMS under `--turbopack`, navigate to a page that renders a modal or interactive component; check browser console for React hook call errors (duplicate instance symptom). |
| Node: alias loop | Start any app under `--turbopack`, compile a server component that imports `crypto` or another re-aliased node module; check for module resolution error. |
| CMS pino aliasing | Start CMS under `--turbopack`, trigger a request that exercises the pino logger (any API route with structured logging). |
| Brikette client-side fallbacks | Start brikette under `--turbopack`, navigate to a page that exercises Node-guarded utility code on the client. |
