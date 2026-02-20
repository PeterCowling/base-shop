---
Type: Fact-Find
Outcome: Archived
Status: Archived
Domain: Infrastructure
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-15
Feature-Slug: hostel-markdown-for-agents
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: none
Related-Plan: none (no plan created)
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID:
Last-reviewed: 2026-02-15
Archived-Reason: Cloudflare-native Markdown for Agents is not viable on the current Brikette Cloudflare Pages static export deployment; no maintainable repo-only path to satisfy origin requirements without changing deploy model.
---
# Hostel Website: Markdown For Agents Fact-Find Brief


## Disposition (2026-02-15)
This brief is **archived** because the originally-scoped approach (Cloudflare-native Markdown for Agents via `Accept: text/markdown` on the existing Brikette Cloudflare Pages static export) is **impractical** under current constraints.

### What we verified
- Live behavior (2026-02-15):
  - `Accept: text/markdown` on `https://hostel-positano.com/en` and `https://www.hostel-positano.com/en` returns `Content-Type: text/html; charset=utf-8`.
  - `/en/markdown` returns `404 Not Found`.
- Repo behavior:
  - `apps/brikette/` deploys as a static export to Cloudflare Pages with no edge middleware in this app to transform HTML to Markdown.

### Why this is impractical in that way
Cloudflare Markdown for Agents has origin/response constraints that we cannot reliably satisfy from the current Pages static export without changing the deployment model (for example introducing a Worker/Pages Functions layer) or generating parallel markdown artifacts at build time.

### If we ever revisit
Treat this as a new scoped plan with an explicit architecture choice:
- Option A: generate and publish deterministic `*.md` artifacts at build time (explicit routes, no `Accept` negotiation).
- Option B: introduce an edge layer (Worker / Pages Functions) to serve markdown under a dedicated path and/or content negotiation.

## Scope
### Summary
Enable a machine-consumable Markdown representation of Hostel Brikette pages (served at `hostel-positano.com` and `www.hostel-positano.com`) so that agent clients can request page content as Markdown rather than HTML.

This fact-find is scoped to **Hostel's website only** (the Brikette app) and explicitly does not roll out to other Base-Shop sites.

### Goals
- When a client requests a page with `Accept: text/markdown`, the response returns `Content-Type: text/markdown` (not HTML) for at least:
  - `https://hostel-positano.com/en`
  - `https://www.hostel-positano.com/en`
- Returned Markdown is stable enough for LLM ingestion (no nav/boilerplate dominating, content order sensible).
- The change is operable: there is a repeatable verification check (script and/or CI step) that alerts if Markdown stops working.

### Non-goals
- Enabling Markdown-for-Agents across every other website/app in the monorepo.
- Rewriting Hostel website content, IA, SEO, or translations as part of this work.
- Adding new booking flows or product features.

### Constraints & Assumptions
- Constraints:
  - Brikette deploy is currently **Cloudflare Pages static export** (no Worker by default) and must remain stable.
  - No shortcuts: if Cloudflare's native feature is incompatible, we should choose an approach that is maintainable and testable (not a hacky one-off).
- Assumptions:
  - "Hostel website" == `apps/brikette/` (Brikette) deployed to `www.hostel-positano.com`.

## Evidence Audit (Current State)
### Entry Points
- Hostel site app code: `apps/brikette/`.
- Production URL and deploy pipeline: `.github/workflows/brikette.yml` and `docs/github-setup.md`.

### Key Modules / Files
- `apps/brikette/src/config.ts` — `DOMAIN` falls back to `https://hostel-positano.com`.
- `apps/brikette/src/config/baseUrl.ts` — base URL resolution; default fallback `https://hostel-positano.com`.
- `.github/workflows/brikette.yml` — deploys static export `apps/brikette/out` via `wrangler pages deploy` to Pages project `brikette-website`; production URL `https://www.hostel-positano.com`.
- `docs/github-setup.md` — confirms Brikette is Pages, production URL `www.hostel-positano.com`.
- `apps/brikette/public/llms.txt` — exists and lists machine-readable sources (schema, openapi, ai-plugin, sitemap, rates).
- `apps/brikette/src/test/machine-docs-contract.test.ts` — contract tests for machine-readable docs.
- `apps/brikette/public/_headers` — cache headers applied in Pages mode.
- `docs/brikette-deploy-decisions.md` — partially outdated: it claims production Workers paid, but current workflow and `apps/brikette/wrangler.toml` indicate production is now Pages.
- `apps/brikette/wrangler.toml` — explicitly marked as legacy Worker config.

### Patterns & Conventions Observed
- Machine-readable surface area is already treated as a contract and tested:
  - evidence: `apps/brikette/src/test/machine-docs-contract.test.ts`.
- Deploy is Pages static export (not Worker middleware):
  - evidence: `.github/workflows/brikette.yml`.

### Dependency & Impact Map
- Upstream dependencies:
  - Cloudflare Zone settings for `hostel-positano.com` (feature enablement + plan level).
  - Cloudflare Pages behavior for response headers (notably `Content-Length`).
- Downstream dependents:
  - LLM/agent clients that request Markdown via `Accept: text/markdown`.
  - Any future automated checks that rely on Markdown being available.
- Likely blast radius:
  - Mostly operational: Cloudflare settings and response header behavior.
  - Potential repo changes only if we add a verification script, docs, or a Pages Function / Worker fallback.

### Delivery & Channel Landscape (mixed)
- Audience/recipient:
  - Agents/LLMs consuming site content.
  - Internal operators running verification checks.
- Channel constraints:
  - Cloudflare's feature is negotiated via request header: `Accept: text/markdown`.
  - Cloudflare's converter has hard constraints (see External Research) that may not match current Pages responses.
- Approvals/owners:
  - Owner: Pete (Cloudflare account + repo).
- Measurement hooks:
  - A simple synthetic probe (curl) is sufficient as the primary health check.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Cloudflare "Markdown for Agents" can be enabled for the hostel zone | Zone on Pro/Business/Enterprise (or upgraded) | $ (plan) | minutes |
| H2 | After enablement, `Accept: text/markdown` returns `Content-Type: text/markdown` for `/en` | Feature enabled + origin meets constraints | none | minutes |
| H3 | Current origin responses meet Cloudflare converter requirements | `Content-Length` present; <=1MB | none | minutes |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|-----------|-------------------|--------|---------------------|
| H2 (currently) | `Accept: text/markdown` still returns HTML | live probe | High |
| H3 (currently) | HTML responses for `/en` are chunked and have **no `Content-Length`** | live probe | High |

#### Falsifiability Assessment
- Easy to test:
  - Whether Markdown works on a URL: `curl -I -H 'Accept: text/markdown' https://hostel-positano.com/en`.
- Harder to test:
  - Whether Cloudflare Pages can be made to emit `Content-Length` for HTML routes without changing deployment model.

#### Recommended Validation Approach
- Quick probes first:
  - Verify Cloudflare zone plan supports it.
  - Enable feature (if allowed), then re-run curl checks.
- If native feature cannot work (due to `Content-Length` limitation), pivot to a deterministic fallback (Pages Function or Worker) and add a repeatable verification contract.

### Live Behavior Probes (2026-02-14)
- Current HTML for `/en`:
  - `curl -I --http1.1 https://hostel-positano.com/en` returns `Content-Type: text/html; charset=utf-8` and `Transfer-Encoding: chunked` (no `Content-Length`).
- Current Markdown negotiation attempt:
  - `curl -I --http1.1 -H 'Accept: text/markdown' https://hostel-positano.com/en` still returns `Content-Type: text/html; charset=utf-8`.
- `.../en/markdown` is a 404 (so any "suffix" approach is not currently wired):
  - `curl -I https://hostel-positano.com/en/markdown` -> 404.

## External Research (needed)
- Cloudflare "Markdown for Agents" reference docs:
  - Enablement: via Cloudflare Dashboard "Quick actions" or via API setting (`content_converter`).
  - Availability: requires Pro/Business/Enterprise (per docs).
  - Limitations include:
    - Origin response must include a `Content-Length` header.
    - Response must be <= 1MB.
    - If constraints are not met, Cloudflare returns the original HTML.
  - Source: `https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/`
- Cloudflare blog announcement highlights:
  - Markdown responses include `Vary: accept`, `X-Markdown-Tokens`, and a `Content-Signal` header. (Blog also notes customization options are planned.)
  - Source: `https://blog.cloudflare.com/markdown-for-agents/`

## Test Landscape (mixed)
#### Test Infrastructure
- Frameworks:
  - Jest for unit/contract tests.
  - Node-scripted smoke tests.
- Commands:
  - `pnpm --filter @apps/brikette test` (Jest, `--runInBand`).
  - `pnpm --filter @apps/brikette typecheck`.
  - `pnpm --filter @apps/brikette e2e:smoke` (script-based).
- CI integration:
  - Brikette workflow shards Jest tests via `.github/workflows/reusable-app.yml`.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Machine-readable docs | contract-ish/unit | `apps/brikette/src/test/machine-docs-contract.test.ts` | Ensures `llms.txt`, OpenAPI, ai-plugin manifest paths exist and parse |

#### Coverage Gaps (Planning Inputs)
- There is no automated check that `Accept: text/markdown` returns Markdown on production.

#### Testability Assessment
- Easy to test:
  - Add a post-deploy `curl` probe (script) against production URLs.
- Hard to test:
  - Cloudflare dashboard settings and plan availability cannot be validated purely in Jest; needs operator/infra validation.

#### Recommended Test Approach
- Treat Markdown availability as an operational contract:
  - Add a deterministic healthcheck script that asserts `Content-Type: text/markdown` (and optionally `Vary: accept`) for 1-3 representative URLs.

## Questions
### Resolved
- Q: Which codebase represents the hostel website?
  - A: `apps/brikette/`.
  - Evidence: `.github/workflows/brikette.yml`, `apps/brikette/src/config.ts`.

- Q: Is Markdown-for-Agents currently enabled?
  - A: No, at least not effectively.
  - Evidence: 2026-02-14 live probes show HTML returned even with `Accept: text/markdown`.

### Open (User Input Needed)
- Q: Are you willing to upgrade/ensure the Cloudflare plan level for `hostel-positano.com` to Pro/Business if required?
  - Why it matters: Cloudflare docs gate the feature behind Pro/Business/Enterprise.
  - Decision impacted: whether we can use Cloudflare-native Markdown for Agents vs building a fallback.
  - Decision owner: Pete.
  - Default assumption + risk: Default to "no"; risk is we need to implement and maintain a custom solution.

- Q: Are you OK with Cloudflare adding `Content-Signal: ai-train=yes, search=yes, ai-input=yes` headers when serving Markdown?
  - Why it matters: this is an explicit signal about AI usage/training and may not match your intent.
  - Decision impacted: whether to enable the native feature now or wait for customization / use a custom endpoint without that signal.
  - Decision owner: Pete.
  - Default assumption + risk: Default to "no"; risk is slower path (custom build).

- Q: How broad should the Markdown coverage be for Hostel?
  - Why it matters: Full-site Markdown implies either a robust edge transform or generating many `.md` artifacts.
  - Decision impacted: scope, effort, and verification strategy.
  - Decision owner: Pete.
  - Default assumption + risk: Default to "top pages only" (`/en`, room pages, guides index); risk is agents hitting uncovered URLs.

## Confidence Inputs (for /lp-do-plan)
- **Implementation:** 70%
  - Cloudflare-native enablement steps are clear, but compatibility is blocked by the current lack of `Content-Length` on HTML responses.
- **Approach:** 65%
  - Two viable approaches exist (Cloudflare-native vs custom fallback); choosing depends on plan/budget + content-signal preference.
- **Impact:** 75%
  - Likely low code blast radius, but non-trivial operational impact (Cloudflare settings + caching/Vary semantics).
- **Delivery-Readiness:** 60%
  - Requires Cloudflare dashboard/API access and decisions on plan level + content-signal policy.
- **Testability:** 80%
  - We can add a simple `curl`-based contract check; infra enablement still needs manual confirmation.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Cloudflare native feature remains ineffective due to `Content-Length` limitation (Pages responses are chunked) | High | High | Validate on staging/production after enablement; if blocked, pivot to Worker/Pages Function or static `.md` generation |
| Cloudflare plan cost / gating prevents enablement | Medium | High | Decide upfront whether Pro/Business is acceptable |
| `Content-Signal` defaults conflict with desired AI posture | Medium | Medium/High | Decide whether to accept defaults; consider custom endpoints if not |
| Caching variance (`Vary: accept`) could create cache fragmentation or unexpected behavior | Medium | Medium | Limit initial verification URLs; monitor headers/caching behavior |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep scope limited to Brikette / hostel domain.
  - If adding code, prefer deterministic generation/verification and add tests/scripts rather than manual-only steps.
- Rollout/rollback expectations:
  - Rollout should be reversible via Cloudflare setting toggle or route disabling.
  - If adding custom endpoint behavior, gate behind a config flag or isolated route.
- Observability expectations:
  - At minimum, add a repeatable probe that can be run locally and from CI.

## Suggested Task Seeds (Non-binding)
- Determine current Cloudflare plan for `hostel-positano.com` and whether Markdown for Agents is available.
- If available, enable Markdown for Agents and re-run probes for `/en` (both hostnames) verifying `Content-Type: text/markdown`.
- If enablement fails due to missing `Content-Length`:
  - Investigate whether Pages can be configured to include `Content-Length` for HTML responses.
  - If not, design a fallback:
    - Option 1: Cloudflare Worker in front of Pages that serves `/__md/<path>` or performs `Accept: text/markdown` negotiation.
    - Option 2: Postbuild generate `index.md` alongside static HTML and expose it (plus optional negotiation).
- Add a post-deploy verification script (e.g. `scripts/post-deploy-brikette-markdown-check.sh`) and wire it into the Brikette deploy workflow.
- Update docs/runbook: where to enable/disable the feature; how to verify.

## Execution Routing Packet
- Primary execution skill: `/lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Cloudflare setting enabled (or custom fallback deployed)
  - Verification script added and documented
  - Probes confirm `text/markdown` is returned for representative URLs
- Post-delivery measurement plan:
  - Run the probe in CI post-deploy and fail/alert on regression.

\1 Archived
- Blocking items (historical):
  - Decision on Cloudflare plan upgrade.
  - Decision on whether `Content-Signal` defaults are acceptable.
- Recommended next step:
  - If revisited, create a new plan that explicitly chooses build-time artifacts vs an edge layer.
