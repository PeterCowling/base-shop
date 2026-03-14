---
Type: Replan-Notes
Feature-Slug: startup-loop-ui-audit-integration
Replan-round: 1
Last-updated: 2026-03-14
---

# Replan Notes — startup-loop-ui-audit-integration

## Round 1 — 2026-03-14

### Trigger

Plan critique loop produced 3 rounds at score 6/10 (lp_score 3.0, "partially credible") — auto-build blocked. The same Critical finding appeared in all 3 rounds:

> **[Critical]** TASK-05 introduces `s9b-gates.ts` with no runtime consumer. Tests can pass against the TypeScript while the live Markdown gate drifts.

### Root Cause Analysis

The original TASK-05 design created `scripts/src/startup-loop/s9b-gates.ts` as a TypeScript implementation module, parallel to `s6b-gates.ts`, with the intent of following an established pattern. However:

1. `s6b-gates.ts` was cited as the pattern to follow — but that module has a SELL gate that is meaningfully complex (strategy + activation, multi-check, business path logic). The TypeScript module there serves as the canonical implementation for business-critical gate evaluation.
2. `s9b-gates.ts` would have been a TypeScript reimplementation of gate logic whose authoritative source is an AI-readable Markdown file (`s9b-gates.md`) that the agent follows at runtime. No code path ever calls `s9b-gates.ts` — only the test does. This is genuinely different from `s6b-gates.ts` which is the authoritative implementation.
3. The critique correctly identified this as dead code from a runtime perspective, introducing a synchronization obligation with no enforcement mechanism.

### Resolution

**TASK-05 restructured: drop `s9b-gates.ts` module entirely.**

The test file (`s9b-ui-sweep-gate.test.ts`) contains all gate-parsing helpers inline:
- `extractFrontmatter(content: string): string | null`
- `readField(content: string, key: string): string | null`
- `parseDate(value: string | null): Date | null`
- `parseLeadingInt(value: string | null): number`
- `evaluateUiSweepGate(sweepsDir: string, biz: string, now?: Date): Promise<GateResult>` (local, not exported)

These helpers are private to the test file. No separate module to maintain. When `s9b-gates.md` gate logic changes, there is exactly one TypeScript file to update.

### Evidence Gathered

| Finding | Evidence | Source |
|---|---|---|
| `Modes-Tested` field format varies | `"light, dark"` (with space) in `2026-03-01-brik-homepage`; `"light,dark"` (no space) in `2026-03-12-reception-remaining-theming` | Live artifacts in `docs/audits/contrast-sweeps/` |
| `Business:` field absent from all existing artifacts | grep across all 10 artifacts returns no match | `docs/audits/contrast-sweeps/*/contrast-uniformity-report.md` |
| `Routes-Tested` format confirmed | `"0 (auth-blocked — token-level + code-level analysis only)"` → `parseInt()` correctly extracts 0 | `2026-03-12-reception-remaining-theming/contrast-uniformity-report.md` |
| `s6b-gates.ts` has a runtime consumer distinction | `s6b-gates.ts` implements SELL gate logic; agent code may reference it. `s9b-gates.ts` was truly test-only with no conceivable runtime caller. | Code architecture review |

### Confidence Change

| Task | Before | After | Reason |
|---|---|---|---|
| TASK-05 | 85% | 90% | `s9b-gates.ts` dropped (Critical finding resolved); `Modes-Tested` format confirmed; `Business:` field absence confirmed; `parseInt` behavior confirmed |

### Topology Change

No topology change. Same 5 tasks, same dependencies, same waves. TASK-05 affects only 1 file (not 2). Sequencing unchanged.

### Replan Gate Status

1. **Promotion Gate:** TASK-05 85% → 90% (≥80 threshold met; E2 evidence from live artifacts)
2. **Validation Gate:** TC-04 added to TASK-05 (grep confirms no separate module). All validation contracts complete.
3. **Precursor Gate:** No new precursor tasks required — Critical finding resolved by design change, not a new unknown.
4. **Sequencing Gate:** No topology change — `/lp-do-sequence` not required.
5. **Escalation Gate:** No operator input required — decision is fully resolvable from codebase evidence.
