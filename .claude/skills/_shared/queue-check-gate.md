# Queue Check Gate (Shared)

Used by `lp-do-fact-find` (Phase 0, fact-find mode) and `lp-do-briefing` (Phase 0, briefing mode).

Before doing anything else, check whether a queued dispatch packet exists for this invocation.

**How to check:**
Read `docs/business-os/startup-loop/ideas/trial/queue-state.json` (if it exists). Look for any packet where:
- `queue_state: enqueued`, AND
- `business` matches the invoked business, AND
- **Briefing mode only:** `status: briefing_ready`, AND
- `area_anchor` or `artifact_id` overlaps materially with the invoked topic.

**Fact-find mode only — bundled work-package check:**
If a matching fact-find packet exists, also run:

```bash
pnpm --filter scripts startup-loop:ideas-work-package-candidates -- --queue-state-path docs/business-os/startup-loop/ideas/trial/queue-state.json --business <BUSINESS> --route lp-do-fact-find
```

If the result contains a candidate whose `dispatch_ids` include the matching packet, prefer that bundled candidate over the single packet. This is how related small ideas are promoted into one fact-find / one plan without losing atomic dispatch logging.

Queue-state compatibility note:
- Canonical lifecycle states are `enqueued`, `processed`, `skipped`, `error`.
- Historical entries may contain legacy states (`auto_executed`, `completed`, `logged_no_action`).
- Treat legacy states as non-pending for this gate. Only `queue_state: enqueued` is actionable.

**If a matching queued packet is found:**

Stop immediately. Output only the following — do not run any phases, read any files, or produce any artifacts:

> A queued dispatch packet exists for this topic and requires confirmation before proceeding.
>
> **Area:** `<area_anchor>`
> **What changed:** `<current_truth>`
> **Proposed scope:** `<next_scope_now>`
> **Priority:** `<priority>`
>
> _(If `triggered_by` is present, insert this block — otherwise omit entirely:)_
> ⚠️ **This was triggered by a recent build, not a new external signal.** Check that this is genuinely new work before confirming — you may be looking at a follow-on from something you already ran.
> _Source: `<triggered_by dispatch_id>`_
>
> Do you want to proceed with this [fact-find | briefing]? Reply **yes** to confirm, or anything else to leave it queued.

**If a bundled work-package candidate is found instead of a single packet:**

Stop immediately. Output only the following:

> A related work-package candidate exists for this topic and requires confirmation before proceeding.
>
> **Feature slug hint:** `<feature_slug_hint>`
> **Dispatches:** `<dispatch_ids comma-separated>`
> **Location root:** `<location_root>`
> **Why bundled:** `<candidate_reason>`
>
> Do you want to proceed with this bundled fact-find? Reply **yes** to confirm, or anything else to leave all dispatches queued.

If the operator replies **yes**:
- single-packet path: proceed to Phase 1 with `Dispatch-ID` set to the matching packet's `dispatch_id`.
- bundled fact-find path: proceed to Phase 1 with `Dispatch-IDs` set to the candidate `dispatch_ids` and `Work-Package-Reason` set to `candidate_reason`.

After artifact persistence is confirmed, and before any queue-state write, verify the artifact file at `fact_find_path` exists on disk (use the Read or Bash tool). If the file does not exist: do **not** write `processed_by`; instead, surface an error naming the dispatch set and the missing `fact_find_path`.

If the file exists, update queue-state using the deterministic helper instead of manual per-packet edits:

```ts
import { markDispatchesProcessed } from "scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.js";

const result = markDispatchesProcessed({
  queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
  dispatchIds: ["<dispatch-id>" /* or the full bundled list */],
  featureSlug: "<feature-slug>",
  factFindPath: "<fact_find_path>",
  route: "dispatch-routed",
  business: "<BUSINESS>",
});
```

Failure policy:
- `{ ok: true }` → continue.
- `{ ok: false, reason: "no_match" }` → stop and surface the missing dispatch linkage.
- `{ ok: false, reason: "conflict" | "parse_error" | "write_error" | "file_not_found" }` → stop and surface the error. Do not continue with a partially-routed bundle.

If the operator replies anything other than **yes**, or does not reply: stop. Do nothing. The packet remains `enqueued`.

**If no matching queued packet is found:**

- **Fact-find mode:** Proceed to Phase 1 as a direct inject. `Trigger-Source` is required in the fact-find frontmatter (per `loop-output-contracts.md` Artifact 1).
- **Briefing mode:** Proceed to Phase 1 as a direct briefing.
