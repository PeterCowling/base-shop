Type: Charter
Status: Canonical
Domain: Product-Pipeline
Last-reviewed: 2025-12-26

Primary code entrypoints:
- apps/product-pipeline/src/app/**
- apps/product-pipeline/src/routes/api/**
- apps/product-pipeline/scripts/runner.ts
- apps/product-pipeline/migrations/**
- apps/product-pipeline/wrangler.toml
- packages/pipeline-engine/**

# Product Pipeline Charter

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

## Goals

- Provide an auditable, operator-friendly pipeline for sourcing products and deciding whether to launch/scale/kill based on return-on-capital over time.
- Turn “analysis” into testable software with explicit stages, artifacts, and persistence (not ad-hoc spreadsheets).
- Keep data acquisition bounded and human-gated where needed (avoid unbounded crawling).

## Core flows

- **Lead → Candidate**
  - Intake leads, dedupe/fingerprint, promote to candidates, record activity log.
- **Stage runs**
  - Execute stage endpoints that attach structured inputs/outputs to a candidate and persist artifacts/evidence.
- **Stage M acquisition**
  - Capture marketplace evidence (HTML + PNG snapshots) via queue worker and/or a human-runner workflow.
- **Decision + launch loop**
  - Generate decision cards and launch plans; ingest pilot actuals; recompute economics and decide scale/kill.

## Key contracts (docs)

- System contract: `docs/product-pipeline/product-pipeline-contract.md`
- 3PL decision pack (inputs to lanes): `docs/product-pipeline/3pl-shipping-approach-decision-v0.md`

## Non-goals / constraints

- Not a general-purpose web crawler; acquisition is bounded, budgeted, and may require human gating.
- Not a tax/legal authority; compliance and hazmat checks are represented as evidence gates and operator inputs.