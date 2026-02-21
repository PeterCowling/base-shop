---
Type: ADR
Status: Accepted
Domain: Platform
Last-reviewed: 2026-02-13
---

# ADR: MCP Startup-Loop Identity and Access Model

- Date: 2026-02-13
- Status: Accepted (Phase 1)
- Related plan: `docs/plans/mcp-startup-loop-data-plane/plan.md` (TASK-05)

## Context

Startup-loop MCP tools need authenticated access to Business OS agent APIs while keeping blast radius and operational complexity low.

Two options were evaluated:

1. Option A: service identity with one scoped API key per environment.
2. Option B: per-business key resolution in MCP at runtime (key ring/secret lookup).

## Decision

Adopt **Option A** for phase 1:

- MCP uses a service identity (environment-scoped key) when calling `/api/agent/*`.
- Stage-aware and business-aware checks stay in MCP policy preflight and BOS route authorization.
- Per-business keying (Option B) remains a future extension only if governance requires tighter tenancy isolation than phase-1 controls provide.

## Why Option A

- Fewer secrets to distribute and rotate in phase 1.
- Simpler deployment and incident response path.
- Clearer centralized audit trail at BOS API boundary.
- Compatible with existing BOS API surface without schema or route changes.

## Phase Split

- Phase 1 (this plan): Option A only.
- Phase 2 (optional): evaluate Option B after production telemetry and governance review.

## Threat-Model Checklist

1. Token distribution path:
   - API key is injected through environment-specific secret management.
   - Key is never committed to repository files.
2. Token rotation cadence:
   - Rotate on a fixed cadence (at least quarterly) and on any credential exposure incident.
3. Blast radius if leaked:
   - Bounded to the environment where key is issued.
   - Reduced via startup-loop tool policy gates and BOS route checks.
4. Audit attribution:
   - Tool invocations include `auditTag`, `business`, and `current_stage` context.
   - BOS route logs remain source of truth for write attribution.
5. Revocation runbook:
   - Revoke key in secret manager.
   - Roll forward with new key and restart MCP service/session.
6. Scope claims model:
   - Runtime enforces stage/tool permission model (`read`, `guarded_write`) before BOS calls.
7. Secret storage boundary:
   - Keys only in runtime env (local shell vars, CI secrets, or deployed secret store).
8. Redaction requirements:
   - Sensitive fields (`apiKey`, `token`, `baseEntitySha`, etc.) are redacted in policy logs.
9. Incident fallback mode:
   - Disable guarded-write tool registration and keep read-only startup-loop tools active.
10. Key expiry policy:
   - Prefer short-lived keys where platform supports it; otherwise enforce periodic rotation and immediate revocation on incident.

## Clarification: Business-OS-Integration Flag

For this workstream, `Business-OS-Integration: off` means:

- no BOS schema changes,
- no BOS route-contract changes,
- no BOS control-plane behavior changes.

MCP still integrates as a **client** of existing BOS APIs.
