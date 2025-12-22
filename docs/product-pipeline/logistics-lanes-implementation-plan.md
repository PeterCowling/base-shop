<!-- docs/product-pipeline/logistics-lanes-implementation-plan.md -->

Type: Plan
Status: Active
Domain: Commerce / Sourcing / Ops / Logistics
Last-reviewed: 2025-12-21
Relates-to charter: (planned) docs/product-pipeline/product-pipeline-charter.md

# Logistics Lanes Implementation Plan (3PL decision support)

Purpose: incorporate 3PL and shipping "lane" models into the product-pipeline app so decisions are auditable, updateable (best guess -> quote -> actuals), and supported by inline explanations.

Primary references:
- Main plan: docs/product-pipeline/taobao-amazon-margin-pipeline-plan.md (Section 6.1)
- Decision pack: docs/product-pipeline/3pl-shipping-approach-decision-v0.md

## Scope (what this plan delivers)

- First-class lane model: lanes, lane versions, and quote basket profiles.
- Evidence and TTL: attach quotes to lane versions, track expiry, and surface confidence.
- Candidate integration: apply a lane version to Stage B/C inputs with traceable metadata.
- Decision support UX: explainers, glossary, and context in the app.
- Update flow: replace best-guess data with refreshed best guess or actual quotes without breaking auditability.
- Optional: scenario comparison across lanes for ranking sensitivity.

## Non-goals (v0)

- Full automation of rate-card ingestion from third-party APIs.
- Dynamic tax/legal advice or jurisdiction-specific compliance logic.
- Replacing Stage B/C operator entry before lane support is proven.

## Active tasks

- [x] PP-LOG-01 — Data model for lanes and versions
  - Status: Done
  - Scope:
    - Add D1 tables for `logistics_lanes`, `lane_versions`, and `quote_basket_profiles`.
    - Store lane metadata: model (A/B/C/D), route, destination type (FBA vs hub), incoterm, and description.
    - Store version metadata: confidence (C0-C3), TTL/expiry, currency + FX metadata, lead-time low/base/high, cost basis (per kg/CBM/shipment), and included/excluded notes.
  - Dependencies: existing D1 schema and artifact storage.
  - Definition of done:
    - Migration applied; tables queried by a basic admin script or API.

- [x] PP-LOG-02 — Lane API + evidence linking
  - Status: Done
  - Scope:
    - CRUD endpoints for lanes and lane versions.
    - Evidence attachments for quotes (R2 artifacts + metadata).
    - TTL/expiry fields exposed; confidence stored and editable.
  - Dependencies: PP-LOG-01.
  - Definition of done:
    - API routes return lane lists + version detail with evidence links.

- [x] PP-LOG-03 — Logistics UI (lanes + versions)
  - Status: Done
  - Scope:
    - New "Logistics / Lanes" area with list and detail views.
    - Badges for confidence (C0-C3) and TTL status (active/expiring/expired).
    - Lane version diff display (what changed vs previous version).
  - Dependencies: PP-LOG-02.
  - Definition of done:
    - Operators can create a lane version and attach evidence in-app.

- [x] PP-LOG-04 — Stage B/C integration ("Apply Lane")
  - Status: Done
  - Scope:
    - Add "Apply lane" flow in Stage B that pre-fills cost and lead-time inputs.
    - Track lane version metadata inside Stage B input JSON (laneVersionId, confidence, TTL, FX basis).
    - Optional: Stage C helper for fee presets (FBA fee anchors, referral % defaults).
  - Dependencies: PP-LOG-02, PP-LOG-03.
  - Definition of done:
    - Stage B runs record which lane version was used; UI shows it.

- [x] PP-LOG-05 — Decision support UX (inline guidance)
  - Status: Done
  - Scope:
    - Embed glossary, incoterms explainers, and cost timing guidance in the UI.
    - Show warnings for expired quotes and low-confidence lanes.
  - Dependencies: PP-LOG-03, PP-LOG-04.
  - Definition of done:
    - Operators see guidance without leaving the app.

- [x] PP-LOG-06 — Lane scenario comparison (optional v1)
  - Status: Done
  - Scope:
    - Recompute Stage K for a candidate under multiple lane versions.
    - Show rank sensitivity and delta in payback/peak cash.
  - Dependencies: PP-LOG-04.
  - Definition of done:
    - Scenario lab can compare at least 2 lanes for one candidate.

- [x] PP-LOG-07 — Pilot actuals feedback loop (optional v1)
  - Status: Done
  - Scope:
    - Store actual landed cost + lead-time outcomes per lane.
    - Compute variance vs quote and promote confidence to C3 when stable.
  - Dependencies: PP-LOG-04, Stage L data availability.
  - Definition of done:
    - Lane version shows actual vs quote variance in UI.

## Implementation notes

- Use lane versioning to preserve auditability: never overwrite an old version; create a new one and mark it active.
- Keep Stage B/C operator entry intact; lane integration should prefill and explain, not override.
- Attach quote PDFs/emails as artifacts; link them to the lane version.
- Enforce expiry in the UI first (warnings/blocks) before any hard API gating.

## Rollout checkpoints (testable)

1) Create a lane and version; attach a quote; see TTL/confidence in UI.
2) Apply lane to a candidate; Stage B input saved with lane metadata.
3) Scenario compare: Stage K recompute for two lane versions (if enabled).
4) Pilot actuals update: lane shows variance and confidence update (if enabled).
