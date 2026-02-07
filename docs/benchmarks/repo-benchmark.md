Type: Benchmark
Status: Reference

# Repository Enterprise Benchmark

**Overall Score: 82/100** | Target: 85 | Gap: 3 points

---

## Domain Scores

| Domain | Weight | Score | Grade |
|--------|--------|-------|-------|
| Architecture & Code Quality | 15% | 91 | Excellent |
| Documentation | 10% | 91 | Excellent |
| Testing & Quality Assurance | 15% | 75 | Good |
| CI/CD & Deployment | 12% | 82 | Excellent |
| Security | 18% | 79 | Good |
| Dependency Management | 8% | 80 | Excellent |
| Performance & Scalability | 10% | 78 | Good |
| Observability & Monitoring | 7% | 72 | Good |
| Developer Experience | 5% | 86 | Excellent |

---

## Remaining Gaps by Domain

### Architecture (91) → Target 92
- No formal ADR process
- Some internal coupling between CMS and platform-core
- ✅ Design-system token architecture complete (colors, typography, spacing, elevation, z-index)
- ✅ UI layer hierarchy enforced (design-system → ui → apps)
- ✅ Brikette type safety: 491 → 69 unsafe assertions (86% reduction)
- ✅ Brikette component modularization: all logic files ≤500 lines, 20+ extracted helpers
- ✅ Config-driven guide overrides: 0 hardcoded guide checks (from 41), extensible config system
- ✅ Brikette memoization cleanup: useMemo 304 → 121, useCallback 113 → 108

### Documentation (91) → Target 92
- No root CONTRIBUTING.md (exists at `docs/contributing.md`)
- OpenAPI specs only for Brikette app
- ✅ Theme customization guide with token override examples
- ✅ TypeDoc API reference for design-system (166 generated docs)

### Testing (75) → Target 80
- Coverage enforcement is local-only (CI collects but doesn't gate PRs)
- Some packages use relaxed thresholds (40% vs 80% target)
- E2E test stability/flakiness not documented
- Chromatic visual regression not enforced as merge gate

### CI/CD (82) → Target 90
- No blue-green/canary deployment
- Rollback not automated

### Security (79) → Target 86
**CRITICAL (still open):**
1. Secrets in git history — `.gitignore` fixed, files removed from tracking, but history not scrubbed and secrets not rotated

**Resolved (2026-01-21):**
- ✅ Firebase rules bypass — Fixed: `auth != null` enforced, timestamp bypass removed
- ✅ Hardcoded role indices — Fixed: role map (`roles/owner == true`) replaces array indices
- ✅ Test auth bypass — Verified: NODE_ENV gate prevents production execution
- ✅ All CMS/pipeline/media endpoints — Shop-level auth + API key auth added
- ✅ CSP headers — Comprehensive directives in middleware
- ✅ SSRF protection — `safeWebhookFetch` with private IP blocking
- ✅ Rate limiting — Trusted IP headers (CF-Connecting-IP) prioritized

**Remaining work:**
- Add TruffleHog/Gitleaks to CI
- Rotate committed secrets
- Scrub git history with `git filter-repo`
- Move Google Apps Script URLs to env vars (4 files in reception app)

### Dependencies (80) → Target 80
- ✅ License compliance tooling: `scripts/check-licenses.mjs` + CI job; policy-as-code at `scripts/license-policy.json`
- ✅ 1329 production packages verified compliant (1325 allowed + 4 documented exceptions)
- 22 vulnerabilities (1 HIGH, 13 moderate, 8 low) — down from 38 (10 HIGH); CI gates on high/critical
- ✅ Overrides for tar (>=7.5.4), axios (>=1.12.0); wrangler updated to 4.60.0; @playwright/test pinned to 1.58.0
- Remaining HIGH: lodash.set (no patch exists; abandoned modular package from cypress-audit>lighthouse). Excluded from scoring via auditConfig.ignoreCves — not penalised as no remediation path exists
- ✅ React on stable 19.2.1 (was canary, now resolved)

### Performance (78) → Target 82
- Lighthouse CI not enforced as gate
- K6 load tests not scheduled in CI
- No bundle analysis in CI
- CDN cache hit ratios not monitored
- No Smart Placement for Durable Objects
- Placeholder resource IDs for KV/D1

### Observability (72) → Target 85
- No OpenTelemetry tracing
- No APM (Datadog, New Relic, etc.)
- No centralized log aggregation
- No alerting/on-call integration
- No formal SLO definitions

### Developer Experience (86) → Target 90
- No devcontainer/Codespaces configuration
- Multi-step local setup required
- ✅ Design-system: clear exports map, TypeDoc generation (`pnpm doc:api`), comprehensive README
- ✅ Claude Code config cleanup (2026-01-24): removed 3 non-functional MCP servers (missing env vars caused silent startup failures); reduced permission rules from 292 → 38 (older version bug split multi-line bash commands into fragments); removed overly-broad wildcards (`sh:*`, `node:*`, `curl:*`) for tighter security

---

## Roadmap to 85

### Phase 1: Secret Rotation & CI Scanning (Current)
**82 → 84** | Remaining: +2 pts

| Action | Domain | Status |
|--------|--------|--------|
| Rotate committed secrets + scrub git history | Security | Pending |
| Add TruffleHog/Gitleaks to CI | Security | Pending |
| Move Google Apps Script URLs to env vars | Security | Pending |

### Phase 2: Testing
**84 → 85** | +1 pt

| Action | Domain | Status |
|--------|--------|--------|
| Add coverage gating to CI | Testing | Pending |
| Resolve 10 HIGH dependency vulnerabilities | Dependencies | Done (9/10; 1 unfixable) |
| License compliance tooling | Dependencies | Done (1329 pkgs verified, CI gated) |

### Phase 3: Observability & Performance
**85 → 88** | +3 pts

| Action | Domain |
|--------|--------|
| Add OpenTelemetry tracing | Observability |
| Define SLOs for critical paths | Observability |
| Enforce Lighthouse CI | Performance |

### Phase 4: World-Class (Post-87)
**87 → 92** | +5 pts

| Action | Domain |
|--------|--------|
| Formal ADR process | Architecture |
| OpenAPI specs for all APIs | Documentation |
| Add APM tooling | Observability |
| Devcontainer setup | DX |
| Coverage to 80%+ enforced | Testing |
| Performance budgets enforced | Performance |

---

## Reference

- [Security Audit](../security-audit-2026-01.md) — Detailed findings
- [Architecture](../architecture.md) — Component layering
- [Testing Policy](../testing-policy.md) — Test rules
- [Design System Plan (archived)](../plans/archive/design-system-plan.md) — Completed token/component work
- [Brikette Improvement Plan](../plans/brikette-improvement-plan.md) — Phase 1–2 complete (type safety, complexity, config patterns)

*Last updated: 2026-01-24 | Rev 13*
