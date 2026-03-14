---
Replan-round: 1
Last-updated: 2026-03-13
---

# Replan Notes — process-improvements-command-centre-redesign

## Round 1 (2026-03-13) — TASK-07 decomposition at TASK-06 CHECKPOINT

**Trigger:** TASK-06 CHECKPOINT contract: TASK-07 at 75% confidence (below 80% IMPLEMENT threshold).

**Evidence gathered:**
- `NewIdeasInbox.tsx` confirmed at 1,684 lines; `NewIdeasInbox` function is exactly 200 lines (skipBlankLines, skipComments)
- 200-line `max-lines-per-function` rule is active for `apps/business-os/src/` (no override)
- `item.isOverdue` already available on `ProcessImprovementsInboxItem` (confirmed `compareWorkItemsForDisplay:160`)
- `isProcessImprovementsOperatorActionItem` helper already defined at line 124
- Header stats strip (lines 1584–1608) is extractable as a named sub-component without behaviour change
- `filteredDeferredItems` and `recentActions` are already computed — collapse state is purely a toggle addition

**Decision:**
TASK-07 (L effort, 75% confidence) decomposed into:
- TASK-07a: swimlane split — extract header stats + add 3 active InboxSections → 85%
- TASK-07b: collapse deferred + done → 85%

**Topology change:**
- TASK-07 superseded; TASK-07a + TASK-07b added
- Wave 6 parallelism preserved: TASK-07a + TASK-08 + TASK-09 (no file overlap)
- Wave 7 added: TASK-07b (depends on TASK-07a, same file)
- `/lp-do-sequence` run — Parallelism Guide updated in plan.md
