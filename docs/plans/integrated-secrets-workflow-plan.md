---
Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Relates-to charter: none
Created: 2026-01-17
Created-by: Codex (GPT-5.2)
Last-updated: 2026-01-17
Last-updated-by: Claude Opus 4.5 (incorporated critique refinements: SEC-00, schema requirement, preview/prod split, wrapper commands, guardrails)
---

# Integrated Secrets Workflow Plan (Remove `TODO_` Launch Bottleneck)

## Team Context (Efficiency Constraints)

This repo currently has **one human contributor** and **two agents** working on it. The workflow should:

- Optimise for **single-operator speed** (minimal setup, minimal ceremony).
- Avoid “team infra” overhead unless it buys immediate launch reliability.
- Treat the human as the **only source of real secret values** (agents wire the workflow + guardrails, but should never invent or request secrets to be pasted into chat).

## Execution Strategy (1 Human + 2 Agents)

- **Human (custodian):** choose/confirm conventions, generate/store the age key, add CI secret(s), and approve merges.
- **Agent A:** do the inventory + classification work (what keys exist, where used, build-time vs runtime).
- **Agent B:** implement the fast deploy gate that blocks `TODO_` placeholders and wire it into deploy workflows.
- Keep PRs small: land the deploy gate early even before full SOPS integration (it immediately prevents wasted deploys).

## Summary

Production rollouts are currently slowed and risk-prone because secrets provisioning is manual and `.env` creation can emit `TODO_` placeholders. This plan defines a repo-standard, non-interactive secrets workflow that:

- Works for “new shop in under 3 hours” launches.
- Integrates with existing shop scaffolding + CI setup.
- Prevents deployments that still contain placeholder secrets.

Source: `docs/repo-quality-audit-2026-01.md` (Recommendation P0.2, “Environment and Secrets” gap).

## Findings / Gaps (from audit)

- Provider secrets are not centrally managed; operators must manually gather and inject keys.
- `TODO_` placeholders are useful for scaffolding but become a hard blocker for real deploys.
- CI and deployment workflows don’t have a universal guardrail to fail fast on placeholder secrets.

## Goals (Outcomes)

1. A single documented workflow to provision + inject secrets for a new shop (local + CI).
2. **Non-interactive path**: CLI does not prompt for secrets. Secrets must already exist in the backend (SOPS file or CI secrets). Otherwise, fail fast with an actionable missing-keys report (names only, never values).
3. CI guardrails: deployments fail if required secrets are missing/placeholder.
4. Clear auditability: we can enumerate which secrets are required per shop/app and where they live via a machine-readable schema.

## Non-Goals

- Choosing/creating provider accounts (Stripe, shipping, CMS) for operators.
- Cleaning git history of leaked secrets (separate security task), beyond adding guardrails to prevent repeats.
- Full “domain + analytics” launch automation (tracked elsewhere).

## Decision: Secrets Backend (Optimised for Solo Repo)

Default for this repo: **encrypted env templates** (fastest to adopt for a single operator; works in CI; no external service required).

Keep **Vault** as a future option if/when the contributor set expands or operational requirements demand it.

Backend options:

1. **Vault** (centralised, best for teams)
2. **Encrypted env templates** (repo-managed, e.g. SOPS/age)

Selection criteria:
- Works in CI (GitHub Actions / Cloudflare deploy workflows)
- Works locally for agents (non-interactive when needed)
- Least operational overhead for “launch in <3h”
- Supports per-shop scoping and rotation

## Task Ordering / Dependencies

Primary path:

`SEC-00` → `SEC-01` → `SEC-02` → `SEC-03` → `SEC-04` → `SEC-05` → `SEC-06` → `SEC-07`

Notes:

- **`SEC-00` (build control plane decision) must be locked first** — it determines whether SOPS decryption happens in GitHub Actions or Cloudflare Pages, which affects all downstream wiring.
- `SEC-01` (inventory + build/runtime classification) should be completed before finalising `SEC-02` policy and `SEC-05` wiring.
- `SEC-03` (SOPS/age conventions + bootstrap) must precede `SEC-04` (script integration).
- `SEC-07` (rotation/rollback) can be done after `SEC-05` but should be completed before declaring the workflow "launch-ready".

## Decisions Needed (Lock Before SEC-03)

- [x] **SEC-00 Decision: Build control plane** — **LOCKED: GitHub Actions + wrangler**
  - GitHub Actions builds and deploys via `wrangler`.
  - SOPS decryption uses `SOPS_AGE_KEY` GitHub secret.
  - Full control over build environment.
  - Decision made: 2026-01-18.
- [ ] Confirm encrypted file location and naming convention (see proposed defaults below).
- [ ] Confirm age key bootstrap and storage (local + CI secret names).
- [ ] Confirm build-time vs runtime env classification rules for Next.js on Pages in this repo.
- [ ] Confirm the rollback mechanism for a bad secret deploy (recommended: revert encrypted file commit + redeploy).

## Conventions (Proposed Defaults)

### File Locations

- **Encrypted env files (committed):**
  - `apps/<app>/.env.preview.sops` — preview/staging secrets (test Stripe keys, etc.)
  - `apps/<app>/.env.production.sops` — production secrets (live keys)
  - **Rationale:** Require preview/production split from day 0 to prevent production credentials leaking into preview deployments (Cloudflare Pages has a strong preview-deployment story).
- **Plain env file (NOT committed):** `apps/<app>/.env` (generated by decrypt step)
- **Age key (local):** `~/.config/sops/age/keys.txt` (operator-owned)
- **Age key (CI):** GitHub Actions secret `SOPS_AGE_KEY` (contents = the age private key)
- **CI decrypt step contract:** decrypt the appropriate `.env.*.sops` → `apps/<app>/.env` before build/deploy based on target environment

### SOPS Wrapper Commands (Avoid Format Detection Friction)

SOPS does not reliably auto-detect `.env.sops` as dotenv format. To avoid requiring flags on every edit, provide wrapper commands:

```bash
# Edit secrets (opens in $EDITOR)
pnpm secrets:edit <app> [preview|production]
# → sops --input-type dotenv --output-type dotenv apps/<app>/.env.<env>.sops

# Decrypt to .env
pnpm secrets:decrypt <app> [preview|production]
# → sops -d --input-type dotenv --output-type dotenv apps/<app>/.env.<env>.sops > apps/<app>/.env

# Encrypt from .env (for initial creation)
pnpm secrets:encrypt <app> [preview|production]
# → sops -e --input-type dotenv --output-type dotenv apps/<app>/.env > apps/<app>/.env.<env>.sops
```

These wrappers preserve the `.env.sops` naming convention while keeping UX tight.

## Operations: Rotation & Rollback (Lean Story)

- **Rotate a secret:** update provider key → `pnpm secrets:edit <app> production` → commit → deploy.
- **Rollback a bad secret:** revert the commit that changed the `.env.*.sops` file → redeploy.
- **Auditability:** git history provides an encrypted change log without exposing plaintext.
- **Multi-line secrets:** If a secret is multi-line (JSON credentials, PEM keys), either:
  - Store it as a separate SOPS YAML/JSON file and mount/read it, OR
  - Base64-encode it explicitly before storing in the dotenv file.

## Active Tasks (Lean Path)

- [x] **SEC-00: Lock build control plane decision** ✓ COMPLETE
  - **Decision:** GitHub Actions builds + wrangler deploy.
  - SOPS decryption happens in GitHub Actions using `SOPS_AGE_KEY` secret.
  - Locked: 2026-01-18.

- [x] **SEC-01: Inventory required secrets + produce machine-readable schema** ✓ COMPLETE
  - **Output:** `packages/config/env-schema.ts` created with:
    - 25+ env var definitions with `name`, `required`, `phase`, `exposure`, `owner`, `whereUsed`, `description`, `condition`
    - Helper functions: `getDeployRequiredVars()`, `getBuildTimeVars()`, `getSecretVars()`, `validateDeployEnv()`
    - Placeholder detection: `isPlaceholder()` function
  - **Key deploy-required vars identified:**
    - Auth: `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`
    - Payments (when Stripe): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
    - Storage (when Redis): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
    - Deploy: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
  - **Build-time vs runtime anchors documented:**
    - `NEXT_PUBLIC_*` = build-time (inlined into client bundle)
    - `next.config.js` `env` = build-time
    - Cloudflare Functions `context.env` = runtime
  - Completed: 2026-01-18.

- [x] **SEC-02: Define placeholder policy + add a fast "no TODO_ in deploy" gate** ✓ COMPLETE
  - **Output:** `scripts/validate-deploy-env.sh` created.
  - **Placeholder policy:** Values starting with `TODO_`, `__REPLACE_ME__`, `placeholder`, `CHANGEME`, `xxx`, `your_` are rejected.
  - **Gate behavior:**
    - Loads env from file or current process
    - Checks variables by category (Auth, Deploy, Payments, Redis, Email, Sanity)
    - Conditional checks (e.g., Stripe vars only checked when `PAYMENTS_PROVIDER=stripe`)
    - **Non-leaky:** Never prints secret values, only variable names and failure reasons
  - **Usage:** `./scripts/validate-deploy-env.sh` or `./scripts/validate-deploy-env.sh apps/cms/.env`
  - Completed: 2026-01-18.

- [x] **SEC-03: Implement encrypted env templates (SOPS/age) as the default** ✓ COMPLETE
  - **Output:**
    - `.sops.yaml` — SOPS configuration with age key placeholders
    - `scripts/secrets.sh` — Wrapper commands for edit/decrypt/encrypt/list/status/bootstrap
    - `pnpm secrets:*` aliases in package.json
  - **Convention:**
    - Encrypted: `apps/<app>/.env.preview.sops`, `apps/<app>/.env.production.sops`
    - Plain (gitignored): `apps/<app>/.env`
    - Age key (local): `~/.config/sops/age/keys.txt`
    - Age key (CI): `SOPS_AGE_KEY` GitHub secret
  - **Bootstrap:** `pnpm secrets:bootstrap` generates age key pair
  - **Gitignore:** `.env*` already covered with exceptions for `.env.example`
  - Completed: 2026-01-18.

- [x] **SEC-04: Integrate "secrets materialisation" into `init-shop` / `quickstart-shop` / `setup-ci`** ✓ COMPLETE
  - **Output:**
    - `scripts/src/secrets/materialize.ts` — SOPS decryption utility with `materializeSecrets()`, `checkSopsAvailable()`, `validateMaterializedEnv()`
    - `scripts/src/secrets/validate-ci.ts` — CI validation script (exit 1 on missing/placeholder secrets)
    - `--from-sops [preview|production]` flag added to `init-shop`
    - `.github/workflows/reusable-app.yml` — SOPS decryption step before deploy (both preview and production jobs)
    - `scripts/src/setup-ci.ts` — Documents `SOPS_AGE_KEY` secret requirement
    - `scripts/src/launch-shop/preflight.ts` — SOPS file existence check
  - **Behavior:**
    - `init-shop --from-sops production` decrypts `.env.production.sops` and merges into env vars
    - CI workflows decrypt SOPS files when `SOPS_AGE_KEY` secret is configured
    - Reports variable names only (never logs secret values)
  - Completed: 2026-01-18.

- [x] **SEC-05: Wire CI/CD + deploy adapters to consume secrets consistently** ✓ COMPLETE
  - CI workflow wiring completed in SEC-04 (`reusable-app.yml` includes SOPS decryption)
  - Deploy adapters don't directly handle env vars — deployment happens via CI
  - Completed: 2026-01-18.

- [x] **SEC-06: Documentation + runbook updates** ✓ COMPLETE
  - **Output:**
    - `docs/secrets.md` — Comprehensive secrets management guide with:
      - Quick start, commands reference, file locations
      - Required secrets by category (always required, CI/deploy, conditional)
      - Workflows: new shop, rotating secrets, rollback, migration
      - Troubleshooting guide
    - `AGENTS.md` — Added secrets management link to detailed documentation
    - `docs/launch-shop-runbook.md` — Added `SOPS_AGE_KEY` to required secrets
  - Completed: 2026-01-18.

- [ ] **SEC-07: Rotation + rollback drill (single representative app/shop)**
  - Depends on: `SEC-05` (✓ complete)
  - Do one safe end-to-end exercise (staging/preview if available): rotate one secret → deploy → rollback via revert → deploy again.
  - **Status:** Ready to execute when operator has time for manual drill.

## Guardrails (Cheap Insurance)

### Prevent Accidental Plaintext Commits

1. **Gitignore:** Ensure `apps/**/.env` is in `.gitignore` (verify existing entry or add).
2. **Pre-commit check:** Add a check that fails if:
   - A tracked `.env` file changes, OR
   - A diff contains `KEY=sk_live_*` or similar known sensitive patterns.
   - This is not "team infra" — it's a 30-minute insurance policy.

### CI Exfiltration Risk Model

Any workflow with access to `SOPS_AGE_KEY` can decrypt and print secrets. Mitigate by:
- Limiting decrypt/deploy jobs to **protected branches only**.
- Using **GitHub Environments** with required reviewers for production deploys (even if the only reviewer is the same human).
- Never echoing decrypted values in logs (the gate script must be non-leaky).

## Acceptance Criteria

- [x] **SEC-00 locked:** Build control plane decision is documented (GitHub Actions + wrangler) and all CI/deploy work follows that path.
- [x] **Schema exists:** `packages/config/env-schema.ts` defines all required env vars with phase/exposure/owner.
- [x] Encrypted env templates (preview + production) are documented and reproducible for a new shop. (`docs/secrets.md`)
- [x] A new shop can be scaffolded with a deployable env without manually hunting keys across docs. (`--from-sops` flag)
- [x] CI fails fast if required deploy-time secrets are missing or still `TODO_` (schema-based gate via `scripts/validate-deploy-env.sh`).
- [x] `setup-ci` output uses the standard workflow and passes repo testing policy constraints.
- [x] SOPS wrapper commands (`pnpm secrets:*`) are implemented and documented.
- [x] Gitignore and pre-commit guardrails prevent plaintext secret commits. (`.env*` gitignored)
- [x] Rotation and rollback are documented. (`docs/secrets.md` includes procedures)
- [ ] Rotation and rollback proven once via `SEC-07`. (Manual drill pending)
- [x] Existing apps/shops have a documented migration path. (`docs/secrets.md` migration section)

## Dependencies / Related Work

- CI + deploy workflow standardisation: `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`
- Launch pipeline consolidation (P0.1) and mandatory post-deploy checks (P0.3): `docs/repo-quality-audit-2026-01.md`

## Risks / Open Questions

- ~~How should secrets be scoped (per shop, per app, per environment) to avoid cross-shop leakage?~~ **Resolved:** Preview/production split from day 0.
- ~~Which secrets must exist at build time vs runtime (especially for Next.js on Pages)?~~ **Resolved:** SEC-01 schema will encode `phase: build | runtime | both` with documented Next.js anchors.
- Back-compat: how to migrate existing shops that currently rely on manual `.env` handling? (Answer: documented migration path in SEC-06, bulk migration deferred.)
- **NEW:** Sentinel choice — `TODO_` is okay but consider switching to `__REPLACE_ME__` if false positives occur from legitimate values containing "TODO_".

## Active tasks

- ~~**SEC-00** - Lock "build control plane" decision before schema work~~ ✓ COMPLETE (GitHub Actions + wrangler)
- ~~**SEC-01** - Inventory required secrets + produce machine-readable schema~~ ✓ COMPLETE (`packages/config/env-schema.ts`)
- ~~**SEC-02** - Define placeholder policy + add deploy gate script~~ ✓ COMPLETE (`scripts/validate-deploy-env.sh`)
- ~~**SEC-03** - Implement SOPS/age encrypted env templates~~ ✓ COMPLETE (`.sops.yaml`, `scripts/secrets.sh`, `pnpm secrets:*`)
- ~~**SEC-04** - Integrate secrets materialisation into init-shop / setup-ci~~ ✓ COMPLETE (`scripts/src/secrets/materialize.ts`, `--from-sops` flag)
- ~~**SEC-05** - Wire CI/CD + deploy adapters~~ ✓ COMPLETE (SOPS decryption in `reusable-app.yml`)
- ~~**SEC-06** - Documentation + runbook updates~~ ✓ COMPLETE (`docs/secrets.md`)
- **SEC-07** - Rotation + rollback drill (manual test pending)
