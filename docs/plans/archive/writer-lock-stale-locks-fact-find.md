---
Type: Fact-Find
Status: Historical
Domain: Repo
Last-reviewed: 2026-02-09
---

# Writer Lock Stale Locks from Subagents - Fact Find

**Status:** Completed and archived
**Date:** 2026-02-07
**Context:** Subagents spawned during parallel translation batches created stale writer locks after process termination.

---

## Executive Summary

This thread is complete and now archived under `docs/plans/archive/`.

Stale writer locks were real and operationally painful. The biggest failure mode was not only stale lock creation, but ambiguous recovery guidance that pushed operators toward bypass behavior.

This has now been hardened so the default path is both strict and fast:
- `writer-lock.sh` exposes first-class stale cleanup with `clean-stale`
- lock token output is redacted by default (`status --print-token` is explicit)
- hook output no longer leaks lock token values
- agent git guard now blocks `SKIP_WRITER_LOCK=1` / `SKIP_SIMPLE_GIT_HOOKS=1` even when set as environment variables
- runbooks now point to one recovery flow instead of bypass examples

---

## Problem Observed

### Symptoms
1. Commits/pushes blocked with writer-lock token mismatch
2. Lock holder PID no longer alive
3. Follow-on attempts encouraged bypass patterns (`SKIP_WRITER_LOCK=1`) rather than deterministic lock recovery

### Root Cause
- Subagent process lifecycle can end without releasing lock metadata
- Recovery was implicit (`acquire` auto-cleaned stale lock opportunistically), but there was no explicit `clean-stale` command
- Error/docs surfaces were inconsistent and sometimes suggested bypass workflows

---

## Current Infrastructure State

### Lock Layer (`scripts/git/writer-lock.sh`)
- `acquire --wait` still auto-recovers stale local locks when PID is dead
- New explicit command: `clean-stale`
- `status` now redacts token by default
- `status --print-token` is required to show full token

### Hook Layer (`scripts/git-hooks/require-writer-lock.sh`)
- Token is redacted in mismatch output
- Recovery guidance points to lock recovery commands
- No user-facing bypass recommendation in the mismatch path

### Agent Guard Layer (`scripts/agent-bin/git`)
- Blocks `SKIP_WRITER_LOCK=1` when set in environment
- Blocks `SKIP_SIMPLE_GIT_HOOKS=1` when set in environment
- Keeps existing block for SKIP_* passed as literal args

### Runbook Layer (`AGENTS.md`, `docs/git-safety.md`)
- Updated to a single, explicit lock-recovery flow
- Agents instructed to fix lock state, not bypass it

---

## Canonical Recovery Flow (Agents)

When writer lock blocks a git write:

1. `scripts/git/writer-lock.sh status`
2. `scripts/git/writer-lock.sh clean-stale` (only if holder PID is dead on this host)
3. `scripts/git/writer-lock.sh acquire --wait`
4. Retry the write inside integrator mode:
   `scripts/agents/integrator-shell.sh -- <command> [args...]`

Do not use `SKIP_WRITER_LOCK=1`.

---

## Effectiveness + Efficiency Assessment

### Effective
- Single-writer invariant remains intact
- Token leak in status/mismatch output is closed
- Bypass env vars are blocked at guard layer for agents

### Efficient
- One official recovery path replaces multiple workaround branches
- Explicit `clean-stale` reduces trial-and-error when dead locks appear
- Reduces repeated agent attempts to bypass required workflow

---

## Open Questions

1. Should we eventually remove `SKIP_WRITER_LOCK=1` path from hook code entirely once `clean-stale` proves sufficient in practice?
2. Do we want stronger stale-lock verification (for example PID start-time checks) to further reduce PID reuse edge-case risk?
3. Should Task/subagent orchestration be taught to avoid lock ownership entirely for read-only/transform-only subagents?

---

## Next Steps

1. Monitor lock incidents for one week to confirm reduced bypass attempts and faster recovery
2. If stable, consider deprecating the writer-lock bypass path for all non-human flows
3. Keep lock recovery guidance concise and identical across all runbooks and hook messages
