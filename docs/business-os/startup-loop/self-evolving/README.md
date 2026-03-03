---
Type: Runbook
Status: Active
Domain: Business-OS / Startup-Loop
Last-reviewed: 2026-03-03
---

# Self-Evolving Contracts

This directory contains machine-checkable contracts and per-business runtime data for the self-evolving startup-loop runtime.

## Directory Structure

```
self-evolving/
├── BRIK/                  # BRIK business data
│   ├── candidates.json
│   ├── events.jsonl
│   ├── observations.jsonl
│   ├── startup-state.json
│   ├── backbone-queue.jsonl
│   └── reports/
│       ├── BRIK-2026-03-02-live.json
│       └── BRIK-2026-03-02-policy-check.json
├── SIMC/                  # SIMC business data
│   ├── candidates.json
│   ├── events.jsonl
│   ├── observations.jsonl
│   └── startup-state.json
├── schemas/               # Shared JSON schemas
│   ├── actuator-adapter.schema.json
│   ├── container-contract.schema.json
│   ├── meta-observation.schema.json
│   └── startup-state.schema.json
└── README.md
```

## Schemas

- `schemas/meta-observation.schema.json`
- `schemas/startup-state.schema.json`
- `schemas/container-contract.schema.json`
- `schemas/actuator-adapter.schema.json`

## Runtime implementation

Implementation lives in `scripts/src/startup-loop/self-evolving/self-evolving-*.ts` modules.

## Runtime entrypoints

- `pnpm --filter scripts startup-loop:self-evolving-from-ideas -- --business <BIZ> --dispatches <path> --startup-state <path>`
- `pnpm --filter scripts startup-loop:self-evolving-report -- --business <BIZ>`
