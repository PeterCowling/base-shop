---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: prime-edge-tls-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-edge-tls-hardening/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306191000-9029
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime Edge TLS Hardening Fact-Find Brief

## Scope

### Summary

The Prime guest portal (`guests.hostel-positano.com`) was recently promoted onto a public custom domain. The underlying Cloudflare zone (`hostel-positano.com`) still runs with `ssl=flexible` and `min_tls_version=1.0`. Both settings are unacceptable for a public-facing app that handles booking-linked guest access flows. This fact-find covers the complete edge hardening path: SSL mode upgrade to Full (strict), minimum TLS raised to 1.2+, security response headers added to the Pages deployment, and the correct posture for distinguishing public guest routes from staff-only surfaces.

### Goals

- Upgrade `hostel-positano.com` CF zone SSL mode from `flexible` to `full` (strict).
- Raise `min_tls_version` from `1.0` to `1.2` (TLS 1.3-only is preferred but requires plan-level confirmation).
- Enable Always Use HTTPS on the zone.
- Add `apps/prime/public/_headers` with production-grade browser security headers.
- Script the CF zone settings changes so they are repeatable and reviewable (not dashboard-only).
- Document the WAF/Access posture boundary for public vs staff-only routes.

### Non-goals

- Implementing CF Access rules on staff routes (flagged as `adjacent_later` in the dispatch; document only).
- Managed WAF ruleset configuration (requires Pro+ plan confirmation — defer if Free plan confirmed).
- Guest auth/session hardening (separate dispatch 9028, separate fact-find).
- Any change to Prime application code or Firebase integrations.

### Constraints & Assumptions

- Constraints:
  - CF Pages custom domains use CF-managed certificates on the backend. Full (strict) mode requires a valid cert between CF edge and origin. For Pages, this works because CF validates its own Pages infrastructure certs — but the custom domain `guests.hostel-positano.com` must have a CF-managed cert assigned.
  - `CLOUDFLARE_API_TOKEN` in `.env.local` is noted as potentially revoked (memory). A new write-capable token (`Edit zone DNS + Zone Settings` permissions) is required to apply zone setting changes via API.
  - TLS 1.0/1.1 deprecation may affect very old mobile browsers used by international guests — this risk is low but must be flagged.
- Assumptions:
  - `hostel-positano.com` zone is on Cloudflare (confirmed by dispatch live audit).
  - Prime is a fully static Cloudflare Pages deployment (confirmed: `wrangler.toml` `pages_build_output_dir = "out"`, CI uses `wrangler pages deploy`).
  - Pages Functions (`functions/g/[token].ts`) are deployed alongside the static output — not a separate Worker.
  - The operator wants zone settings changes to be scripted (not manual dashboard), consistent with the existing CF API pattern in `scripts/src/brikette/cloudflare-analytics-client.ts`.

## Outcome Contract

- **Why:** The Prime guest portal has just been promoted onto a public custom domain, so the Cloudflare edge posture is now part of the real production attack surface rather than an internal preview detail. Leaving the zone on flexible SSL and TLS 1.0 materially weakens transport security and creates ambiguity about what other edge protections are actually in force.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready hardening path exists for the Prime public edge surface covering Full (strict) TLS, modern minimum TLS version, certificate/origin implications for Pages, and the correct WAF or Access boundaries for public guest routes versus staff-only routes.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/wrangler.toml` — CF Pages project config. `pages_build_output_dir = "out"`, project name `prime`. KV namespace `RATE_LIMIT` bound. No zone settings managed here.
- `apps/prime/public/_redirects` — SPA routing for `/checkin/*`, `/staff-lookup/*`, `/g/*`. No `_headers` file exists (confirmed: `find apps/prime -name "_headers"` → no results).
- `apps/prime/functions/g/[token].ts` — CF Pages Function handling `/g/:token` deep links (302 redirect to `/g/?token=…`). This is the primary guest entry surface.
- `.github/workflows/prime.yml` — CI deploy pipeline. Builds static export, deploys via `wrangler pages deploy out --project-name prime`. No CF zone configuration steps in CI.

### Key Modules / Files

- `apps/prime/wrangler.toml` — deployment config; no SSL/TLS settings (CF Pages projects don't manage zone SSL via wrangler)
- `apps/prime/public/_redirects` — route surface map (SPA fallbacks); relevant for understanding which paths need security header coverage
- `apps/prime/next.config.mjs` — thin wrapper on shared config; `trailingSlash: true` for CF Pages static routing; no security headers configured here
- `scripts/src/brikette/cloudflare-analytics-client.ts` — established CF API pattern: `resolveZoneTag(token, undefined, zoneName)` to look up zone by name, Bearer token headers. Zone settings changes follow identical API shape.
- `.github/workflows/prime.yml` — CI deploy reference; a new `apply-zone-settings.sh` step could be added here post-build, or kept as a standalone operator runbook script.

### Route Surface (Public vs Staff)

Confirmed from `apps/prime/out/` contents:

| Route prefix | Classification | Notes |
|---|---|---|
| `/g/*` | Public | Guest token deep-link entry point |
| `/portal` | Public (token-gated in app) | Guest portal landing |
| `/booking-details`, `/eta`, `/activities` | Public (token-gated in app) | Guest data pages |
| `/checkin/*` | Semi-public | Check-in flow |
| `/chat`, `/digital-assistant` | Public (token-gated in app) | Guest comms |
| `/bar-menu`, `/breakfast-menu`, `/complimentary-*` | Public (unauthenticated) | Info pages |
| `/staff-lookup/*` | Staff-only | Should be behind CF Access long-term |
| `/admin` | Staff-only | Should be behind CF Access long-term |
| `/cash-prep`, `/bag-storage` | Staff-only | Should be behind CF Access long-term |
| `/account`, `/find-my-stay`, `/owner`, `/main-door-access`, `/late-checkin` | Mixed — not fully classified | Route group membership not traced; classification deferred to dispatch 9028 fact-find |

### Data & Contracts

- Types/schemas/events:
  - CF Zone Settings API: `PATCH /client/v4/zones/{zone_id}/settings/{setting_id}` with `{ "value": "<new_value>" }`.
  - Settings to change: `ssl` (`"flexible"` → `"strict"` — the CF API value for Full strict mode is `"strict"`, not `"full"`), `min_tls_version` (`"1.0"` → `"1.2"`), `always_use_https` (`"off"` → `"on"`).
  - Zone lookup: `GET /client/v4/zones?name=hostel-positano.com` → zone ID (same pattern as `resolveZoneTag`).
- Persistence:
  - CF zone settings are persisted in Cloudflare's infrastructure, not in this repo. The script is the repeatable application mechanism.
- API/contracts:
  - CF Zone Settings: REST API, Bearer token, JSON body. Matches existing `cloudflare-analytics-client.ts` HTTP client pattern (can reuse `resolveZoneTag`).
  - `_headers` file: Cloudflare Pages static spec — processed at deploy time, not at request time by Pages Functions. Same pattern as `apps/brikette/public/_headers`.

### Dependency & Impact Map

- Upstream dependencies:
  - `CLOUDFLARE_API_TOKEN` with `Zone Settings:Edit` permission (currently in `.env.local` but noted as potentially revoked — operator must verify/regenerate).
  - CF zone for `hostel-positano.com` — already exists (confirmed by dispatch live audit).
  - `guests.hostel-positano.com` CF managed certificate must be active before Full (strict) is applied.
- Downstream dependents:
  - All traffic to `guests.hostel-positano.com` — TLS 1.0/1.1 clients will be hard-rejected after min_tls change.
  - `hostel-positano.com` (brikette website) shares the same zone — the TLS/SSL settings apply zone-wide, not just to the Pages custom domain. The brikette website must also be compatible with Full (strict) and TLS 1.2+.
  - Brikette is also a CF Pages deployment (`apps/brikette`), so Full (strict) is safe for both.
- Likely blast radius:
  - **Zone-wide impact**: SSL mode and min TLS changes apply to ALL hostnames in the zone (`hostel-positano.com`, `www.hostel-positano.com`, `guests.hostel-positano.com`). Brikette traffic at `www.hostel-positano.com` must be validated post-apply.
  - Low risk of actual service disruption since both deployments are CF Pages (no separate origin server to break).
  - `_headers` change is Prime-only (scoped to `apps/prime/public/`).

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CF Pages Function `/g/:token` | Unit | `apps/prime/functions/__tests__/g-token-redirect.test.ts` | Covers redirect logic; not TLS-related |
| Staff-owner access gate | Unit | `apps/prime/functions/__tests__/staff-owner-access-gate.test.ts` | Auth gate, unrelated to TLS |
| CI healthcheck | E2E (CI) | `.github/workflows/prime.yml` `healthcheck-base-url` | Hits `prime-egt.pages.dev`, not custom domain |

#### Coverage Gaps

- No test validates that `guests.hostel-positano.com` is accessible post-deploy (healthcheck uses `prime-egt.pages.dev`).
- No smoke test for TLS version enforcement (protocol-level, can only be tested externally e.g. `curl --tls-max 1.1 https://guests.hostel-positano.com`).
- No test for `_headers` content (this is a Pages concern; no easy unit test seam).

#### Recommended Test Approach

- Unit tests: none needed for zone settings script (it's a thin API wrapper).
- Smoke test (post-apply): add `curl --tls-max 1.1 https://guests.hostel-positano.com` → expect non-2xx as validation script.
- Healthcheck extension: add a separate step in `prime.yml` with `BASE_URL=https://guests.hostel-positano.com` calling `post-deploy-health-check.sh` directly — `healthcheck-extra-routes` accepts path suffixes only and cannot reference a different hostname.

### Recent Git History (Targeted)

- `apps/prime/wrangler.toml` — `fix(prime): set Firebase database URL as wrangler var` — establishes wrangler config pattern; no zone settings precedent.
- `feat(reception): process integrity hardening — auth, email, mutations, and component reliability` (e75f7396) — recent security hardening work in Reception shows security hardening pattern is active; confirms operator intent for Prime.
- `feat: harden staging publish/deploy workflow` (08a4c4e1) — recent infra hardening work; consistent with this task direction.

## Questions

### Resolved

- Q: Is Full (strict) safe for a CF Pages custom domain?
  - A: Yes. CF Pages custom domains are served by CF's own edge/origin infrastructure, which carries a valid managed certificate. Full (strict) validates the cert between CF's edge and the Pages backend — this is CF-to-CF and will succeed without any operator action on certs, as long as the custom domain itself has a CF-managed cert configured in the Pages project dashboard.
  - Evidence: CF Pages documentation pattern; wrangler.toml confirms Pages deployment; both brikette and prime are CF Pages static exports.

- Q: Does the SSL mode change affect brikette (hostel-positano.com)?
  - A: Yes — SSL mode is zone-level, so `www.hostel-positano.com` (brikette) is also affected. Brikette is also a CF Pages deployment, so Full (strict) is safe for it too.
  - Evidence: `apps/brikette/public/_headers` exists (confirmed Pages deployment); brikette CI healthcheck uses `https://www.hostel-positano.com`.

- Q: Should TLS 1.3-only be used instead of 1.2 minimum?
  - A: TLS 1.2 minimum is the correct target. TLS 1.2 is the industry standard floor for HIPAA/PCI environments and is widely supported. TLS 1.3-only would block a non-trivial fraction of older Android and Windows 7 clients. For a hostel guest portal (international guests, diverse devices), TLS 1.2 minimum is the right balance. TLS 1.3 is supported by all modern browsers and will be preferred automatically.
  - Evidence: Dispatch `next_scope_now` says "1.2 or higher"; operator security intent confirmed; broad guest device surface argues against 1.3-only.

- Q: Is there an existing pattern for CF zone settings scripts in the repo?
  - A: Yes. `scripts/src/brikette/cloudflare-analytics-client.ts` exports `resolveZoneTag` (zone lookup by name, Bearer token) and `fetch`-based CF API calls. The zone settings script should follow the same module pattern in `scripts/src/brikette/` or a new `scripts/src/ops/cloudflare-zone-settings.ts`.
  - Evidence: `scripts/src/brikette/cloudflare-analytics-client.ts` lines 88–125.

- Q: What security headers should go in `_headers`?
  - A: Minimum viable set for a guest portal (no iframes, no mixed content):
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS — only safe after Full strict applied)
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    - CSP should be scoped conservatively: Prime uses Firebase (Realtime DB and Auth), external fonts, and a CF Pages Function. A `Content-Security-Policy` should be added but requires careful enumeration of allowed sources. This is a known complexity; a permissive starting CSP is better than none.
  - Evidence: `apps/brikette/public/_headers` (existing pattern); Prime uses Firebase (`CF_FIREBASE_DATABASE_URL` in wrangler.toml).

### Open (Operator Input Required)

- Q: What Cloudflare plan level is the `hostel-positano.com` zone on (Free, Pro, Business, Enterprise)?
  - Why operator input is required: Plan level determines whether Cloudflare managed WAF ruleset (OWASP Core Ruleset) is available. Free plan only allows custom firewall rules. Pro+ enables managed WAF. This affects whether the plan should include a WAF task.
  - Decision impacted: Whether to include a WAF enablement task in the plan.
  - Decision owner: Operator (billing/account owner)
  - Default assumption: Assume Free plan — plan excludes managed WAF; includes only custom firewall rules if any. Task for WAF goes in `adjacent_later`.

- Q: Is the `CLOUDFLARE_API_TOKEN` in `.env.local` still valid, and does it have `Zone Settings:Edit` permission?
  - Why operator input is required: The memory notes the token may be revoked. The script won't work without a valid write-capable token.
  - Decision impacted: Whether the plan includes a "regenerate CF token" pre-task or assumes the existing token works.
  - Decision owner: Operator
  - Default assumption: Token is invalid; plan includes a pre-task to create a new token with `Zone Settings:Edit` permission.

## Confidence Inputs

- Implementation: 88%
  - Basis: CF zone settings API is well-understood; existing `resolveZoneTag` pattern in repo; `_headers` file is a copy-paste from brikette with Prime-specific adjustments.
  - To reach 90%: Confirm CF token validity and zone ID.
- Approach: 92%
  - Basis: Full (strict) + TLS 1.2 + HSTS + `_headers` is the canonical hardening path for CF Pages. No ambiguity.
  - To reach 95%: Operator confirms plan level (WAF scope).
- Impact: 90%
  - Basis: Directly eliminates the TLS 1.0/flexible posture confirmed by live audit. `_headers` adds browser-level protections not present today.
  - Already at 90%.
- Delivery-Readiness: 82%
  - Basis: All file paths known, API pattern established, no new dependencies.
  - To reach 90%: CF token verified/regenerated; custom domain cert status confirmed in CF Pages dashboard.
- Testability: 75%
  - Basis: Zone settings are external — only testable via smoke test (protocol-level curl or online TLS checker). `_headers` are verifiable post-deploy via response inspection. No in-repo unit test seam.
  - To reach 80%: Add custom domain to CI healthcheck and document smoke test command.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Full (strict) causes 525/526 errors if `guests.hostel-positano.com` managed cert is missing | Low | High | Verify managed cert is active in CF Pages dashboard before applying SSL mode change. Plan task 1 is cert verification, task 2 is SSL mode change. |
| HSTS `includeSubDomains` affects other subdomains not yet on HTTPS | Low | Medium | All known subdomains (`www`, `guests`) are CF Pages → already HTTPS. Check for any non-CF HTTP subdomains first. |
| TLS 1.2 minimum breaks old guest devices | Low | Low | TLS 1.2 is supported since Android 4.4 (2013) and iOS 5 (2011). International guest device base is primarily modern mobile. Acceptable risk. |
| CF token lacks `Zone Settings:Edit` permission | Medium | Medium | Pre-task: verify token or create new one. Blocks zone settings tasks only; `_headers` file task can proceed independently. |
| Brikette disruption from zone-wide TLS/SSL change | Very Low | Medium | Both brikette and prime are CF Pages — Full (strict) is safe. Verify brikette healthcheck passes after apply. |
| CSP too restrictive for Firebase / CF Functions | Medium | Low | Use permissive CSP to start (allow `*.googleapis.com`, `*.firebaseio.com`, `*.cloudflare.com`). Tighten iteratively. |

## Scope Signal

Signal: `right-sized`
Rationale: The scope precisely matches the dispatch: three CF zone settings + one `_headers` file + one zone settings script. No over-reach into WAF rules (plan-gated on CF plan level) or guest auth (separate dispatch). All evidence is available; all paths are confirmed.

## Planning Constraints & Notes

- Must-follow patterns:
  - CF API calls must follow the existing `resolveZoneTag` + Bearer token pattern from `scripts/src/brikette/cloudflare-analytics-client.ts`.
  - `_headers` file goes in `apps/prime/public/` (not `apps/prime/out/` — the build copies `public/` into `out/`).
  - Zone settings changes are applied externally (not via wrangler). The script should be a standalone runnable (`pnpm --filter scripts <script-name>`) with dry-run support.
  - HSTS must only be added to `_headers` AFTER Full (strict) SSL is applied — otherwise HSTS over Flexible SSL creates a false security signal. Plan must enforce this ordering.
- Rollout/rollback expectations:
  - SSL mode: reversible via CF API. Rollback: `PATCH ssl → "flexible"`. Low risk.
  - Min TLS: reversible via CF API. Rollback: `PATCH min_tls_version → "1.0"`. Very low risk.
  - `_headers`: reversible by removing the file and redeploying.
  - Recommended apply order: (1) verify cert, (2) apply Full strict, (3) verify site loads, (4) apply TLS 1.2, (5) apply Always HTTPS, (6) deploy `_headers`, (7) smoke test.
- Observability expectations:
  - Post-apply: run `curl -sv https://guests.hostel-positano.com` and check TLS version in handshake.
  - Run `curl -H "Upgrade-Insecure-Requests: 1" http://guests.hostel-positano.com` — expect 301 redirect to HTTPS.
  - Check brikette healthcheck in CI after next brikette deploy.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| CF zone settings API surface | Yes | [Major] SSL Full strict API value is `"strict"` not `"full"` — corrected in Data & Contracts | Fixed inline |
| Prime deployment type (Pages vs Worker) | Yes | None | No |
| Zone-wide blast radius (brikette also affected) | Yes | None — brikette is also CF Pages; safe | No |
| `_headers` file placement and build pipeline | Yes | None — `public/` is copied to `out/` by Next.js export | No |
| CF token availability and permissions | Partial | [Moderate] Token may be revoked (noted in memory) | Surfaced as Open Q2; plan pre-task |
| HSTS ordering (must come after Full strict) | Yes | [Major] If HSTS is deployed before Full strict, HTTP traffic still flows unencrypted with a misleading HSTS header | Resolved: planning constraint added enforcing strict apply order |
| Custom domain cert status | Partial | [Moderate] Cannot verify cert from repo — must check CF Pages dashboard | Surfaced as Risk 1; plan task 1 is cert verification |
| CI healthcheck extension API | Yes | [Major] `healthcheck-extra-routes` is path-suffix only — cannot reference alternate hostname `guests.hostel-positano.com`; requires separate `BASE_URL` override step | Fixed in task seed 6 and recommended test approach |
| Brikette compatibility with Full strict | Yes | None | No |

HSTS-before-Full-strict ordering: Resolved in planning constraints (apply order defined). No critical issues unresolved.

## Suggested Task Seeds (Non-binding)

1. **Verify custom domain cert**: Confirm `guests.hostel-positano.com` has an active CF-managed cert in the CF Pages dashboard. Blocking for SSL mode change.
2. **Create/verify CF zone settings token**: Regenerate or validate `CLOUDFLARE_API_TOKEN` with `Zone Settings:Edit` + `Zone:Read` permissions for `hostel-positano.com`.
3. **Write zone settings script**: `scripts/src/ops/apply-prime-zone-hardening.ts` — applies Full strict SSL, TLS 1.2 min, Always HTTPS using `resolveZoneTag` pattern. Supports `--dry-run`.
4. **Apply zone settings**: Run the script against production zone. Smoke-test immediately (curl TLS check, brikette healthcheck).
5. **Add `_headers` to Prime**: Create `apps/prime/public/_headers` with HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and initial CSP. Deploy via standard CI.
6. **Extend CI healthcheck**: Add a second healthcheck step in `prime.yml` with `BASE_URL=https://guests.hostel-positano.com` calling `post-deploy-health-check.sh`. `healthcheck-extra-routes` only accepts path suffixes relative to the base URL — it cannot check an alternate hostname. A separate step with `BASE_URL` override is the correct approach.
7. **Document WAF/Access posture** (non-coding): Write a short ADR in `docs/plans/prime-edge-tls-hardening/` documenting the public/staff route split and flagging `/staff-lookup/*`, `/admin` as CF Access candidates for future work.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `scripts/src/ops/apply-prime-zone-hardening.ts` exists and has `--dry-run` mode.
  - `apps/prime/public/_headers` exists with minimum required headers.
  - Zone settings confirmed via curl smoke test: TLS 1.2 minimum enforced, Full strict active, HTTP→HTTPS redirect working.
  - CI healthcheck includes `guests.hostel-positano.com`.
- Post-delivery measurement plan:
  - Weekly Cloudflare analytics check: confirm no TLS 1.0/1.1 requests (CF dashboard → Security → TLS versions).
  - Brikette weekly watchdog CI continues to pass (zone-wide change validated).

## Evidence Gap Review

### Gaps Addressed

- CF zone current state: confirmed from dispatch live audit (ssl=flexible, min_tls=1.0, Access not enabled) — sufficient for planning.
- Pages deployment type: confirmed from `wrangler.toml` and CI — Full strict is safe.
- Blast radius: identified that zone-wide settings affect brikette; confirmed both are CF Pages so risk is low.
- Script pattern: established from `cloudflare-analytics-client.ts` — no new API surface needed.

### Confidence Adjustments

- Implementation confidence raised from initial 80% to 88% after confirming Pages deployment type eliminates origin cert complexity.
- Testability lowered to 75% — external zone settings are not unit-testable; smoke test is the only validation gate.

### Remaining Assumptions

- CF custom domain cert is active (cannot verify from repo; must check CF Pages dashboard).
- CF token can be regenerated with appropriate permissions.
- Free plan assumption (WAF excluded from scope); if Pro+, add WAF task.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (open questions are pre-task setup items, not blockers to plan creation)
- Recommended next step: `/lp-do-plan prime-edge-tls-hardening --auto`
