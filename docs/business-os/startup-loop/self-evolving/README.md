---
Type: Runbook
Status: Active
Domain: Business-OS / Startup-Loop
Last-reviewed: 2026-03-02
---

# Self-Evolving Contracts

This directory contains machine-checkable contracts for the self-evolving startup-loop runtime.

## Contracts

- `meta-observation.schema.json`
- `startup-state.schema.json`
- `container-contract.schema.json`
- `actuator-adapter.schema.json`

## Runtime implementation

Implementation lives in `scripts/src/startup-loop/self-evolving-*.ts` modules.

## Runtime entrypoints

- `pnpm --filter scripts startup-loop:self-evolving-from-ideas -- --business <BIZ> --dispatches <path> --startup-state <path>`
- `pnpm --filter scripts startup-loop:self-evolving-report -- --business <BIZ>`
