---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-23
---

# Prompt — WEBSITE-01 L1 First Build Framework

Replace every `{{...}}` placeholder, then run this prompt to produce the WEBSITE-01 artifact:
`docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`

```text
You are building the WEBSITE-01 framework artifact for a startup-loop business.

Task:
Produce a framework-first, agent-ready website V1 assembly brief for:
- Business code: {{BUSINESS_CODE}}
- Business name: {{BUSINESS_NAME}}
- Launch surface: pre-website (WEBSITE-01 path)

Output target (required):
- docs/business-os/strategy/{{BUSINESS_CODE}}/site-v1-builder-prompt.user.md

Primary intent:
Create the contract an implementation agent can use to build the first production-ready website version without re-discovery.

Constraints:
1) This is a framework contract, not a feature-by-feature micro-spec.
2) Use canonical artifacts and code paths; do not restate source content that can be referenced directly.
3) Do not invent business facts. Unknown values must be explicit TODOs with source-path references.
4) Keep V1 bounded to route skeleton + core commerce journey + required legal/support baseline.
5) Enforce design-system/token discipline and accessibility/reduced-motion constraints.

Required source audit inputs:
- Strategy index: {{STRATEGY_INDEX_PATH}}
- Brand dossier: {{BRAND_DOSSIER_PATH}}
- Intake packet: {{INTAKE_PACKET_PATH}}
- Offer artifact: {{OFFER_PATH}}
- Channel artifact: {{CHANNELS_PATH}}
- Measurement plan/setup artifacts: {{MEASUREMENT_PATHS}}
- Current app scaffold path: {{CURRENT_APP_PATH}}
- Legacy/full-surface reference app path (if any): {{LEGACY_APP_PATH}}
- Data baseline path (if any): {{DATA_BASELINE_PATH}}
- Existing design-spec references (if any): {{DESIGN_SPEC_PATHS}}

Write the artifact using this exact section structure:

1) Purpose
2) What This Document Must Do
3) What This Document Must Not Do
4) Non-Negotiable Build Guardrails
5) Out of Scope for V1
6) Build & Run Contract
   - package manager + exact command set (dev/typecheck/lint/test/build)
   - required env key list and missing-secret behavior
7) Canonical Source Map (Consult-Only Inputs)
   - Strategy/outcome
   - Brand/design
   - Existing implementation assets
   - Legacy/full-surface baseline assets
   - Existing feature-level design specs
8) Operational Defaults (Use Unless Overridden)
   - locale strategy
   - data strategy
   - analytics scope
   - legal/support minimum pages
9) V1 Framework Contract
   - site purpose
   - required route/flow surface
   - reuse policy
10) Known Gaps to Resolve During Build
11) Build Sequence (framework-first)
12) Traceability Convention
13) Definition of Done (measurable checks)
14) Implementation Prompt Stub

Definition of Done must include at least:
- Required routes render in dev: /, /shop, /product/[slug], /checkout, /success, /cancelled
- Targeted typecheck/lint pass for changed packages
- Required tests executed for changed surface
- No hardcoded color/spacing values outside token system (exceptions documented)
- reduced-motion behavior verified for animated UI elements
- unresolved unknowns are explicitly tagged with TODO(source-path)

Formatting rules:
- Use concise, operator-readable markdown.
- Prefer tables for source maps/defaults.
- Keep every business/content claim traceable to a path.
- Do not include speculative implementation detail that belongs in task-level plan/design-spec docs.
```

## Quality bar (must pass)

1. The artifact can be handed directly to an implementation agent with no extra discovery prompt.
2. Canonical source paths are explicit and grouped by layer.
3. WEBSITE-01 scope boundaries are explicit; WEBSITE-02 concerns are excluded.
4. Build commands and env expectations are concrete and executable.
5. Definition of Done is testable and non-ambiguous.
