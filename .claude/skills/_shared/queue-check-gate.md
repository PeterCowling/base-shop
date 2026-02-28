# Queue Check Gate (Shared)

Used by `lp-do-fact-find` (Phase 0, fact-find mode) and `lp-do-briefing` (Phase 0, briefing mode).

Before doing anything else, check whether a queued dispatch packet exists for this invocation.

**How to check:**
Read `docs/business-os/startup-loop/ideas/trial/queue-state.json` (if it exists). Look for any packet where:
- `queue_state: enqueued`, AND
- `business` matches the invoked business, AND
- **Briefing mode only:** `status: briefing_ready`, AND
- `area_anchor` or `artifact_id` overlaps materially with the invoked topic.

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

If the operator replies **yes**: proceed to Phase 1 with `Dispatch-ID` set to the matching packet's `dispatch_id`. On artifact persistence, populate `processed_by` in the packet:
- `route: dispatch-routed`, `processed_at: <now>`, `queue_state: processed`
- **Fact-find mode (Phase 6):** `fact_find_slug` and `fact_find_path` from the output.
- **Briefing mode (Phase 4):** `fact_find_slug` (briefing topic slug), `fact_find_path` (briefing output path).

If the operator replies anything other than **yes**, or does not reply: stop. Do nothing. The packet remains `enqueued`.

**If no matching queued packet is found:**

- **Fact-find mode:** Proceed to Phase 1 as a direct inject. `Trigger-Source` is required in the fact-find frontmatter (per `loop-output-contracts.md` Artifact 1).
- **Briefing mode:** Proceed to Phase 1 as a direct briefing.
