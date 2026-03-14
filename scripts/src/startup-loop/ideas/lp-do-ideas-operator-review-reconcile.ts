/**
 * Emits operator_review_recorded lifecycle events by joining operator-action
 * decisions with the canonical operator-actions registry.
 *
 * Only actions that carry a candidate_id are eligible — those represent
 * self-evolving candidate reviews. Decisions on plain stage gates / blockers
 * without a candidate_id are silently skipped.
 *
 * Mapping from process-improvements decisions to lifecycle review decisions:
 *   done  → approved
 *   snooze → deferred
 *
 * Idempotent: appendSelfEvolvingEvent deduplicates by event_id.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  parseProcessImprovementsOperatorActionDecisionEvent,
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH,
  type ProcessImprovementsOperatorActionDecisionEvent,
} from "../operator-action-decisions-contract.js";
import {
  type CanonicalOperatorActionItem,
  OPERATOR_ACTIONS_RELATIVE_PATH,
  parseCanonicalOperatorActionItemsFromJson,
} from "../operator-actions-contract.js";
import {
  type LifecycleReviewDecision,
  stableHash,
} from "../self-evolving/self-evolving-contracts.js";
import {
  appendSelfEvolvingEvent,
  createLifecycleEvent,
} from "../self-evolving/self-evolving-events.js";

export interface OperatorReviewReconcileOptions {
  rootDir: string;
  business: string;
  operatorActionsPath?: string;
  decisionsLedgerPath?: string;
  write?: boolean;
}

export interface OperatorReviewReconcileResult {
  ok: boolean;
  decisions_scanned: number;
  eligible_decisions: number;
  events_written: number;
  events_skipped_duplicate: number;
  error?: string;
}

function mapDecision(
  decision: ProcessImprovementsOperatorActionDecisionEvent["decision"],
): LifecycleReviewDecision {
  return decision === "done" ? "approved" : "deferred";
}

function readDecisions(
  ledgerPath: string,
): ProcessImprovementsOperatorActionDecisionEvent[] {
  let raw: string;
  try {
    raw = readFileSync(ledgerPath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => parseProcessImprovementsOperatorActionDecisionEvent(line))
    .filter(
      (
        event,
      ): event is ProcessImprovementsOperatorActionDecisionEvent =>
        event !== null,
    );
}

function readActions(actionsPath: string): CanonicalOperatorActionItem[] {
  let raw: string;
  try {
    raw = readFileSync(actionsPath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return parseCanonicalOperatorActionItemsFromJson(raw, actionsPath);
}

export function runOperatorReviewReconcile(
  options: OperatorReviewReconcileOptions,
): OperatorReviewReconcileResult {
  const actionsPath = options.operatorActionsPath
    ? path.resolve(options.rootDir, options.operatorActionsPath)
    : path.resolve(options.rootDir, OPERATOR_ACTIONS_RELATIVE_PATH);
  const ledgerPath = options.decisionsLedgerPath
    ? path.resolve(options.rootDir, options.decisionsLedgerPath)
    : path.resolve(options.rootDir, PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH);

  const decisions = readDecisions(ledgerPath);
  const actions = readActions(actionsPath);

  // Index actions by actionId for O(1) lookup
  const actionById = new Map<string, CanonicalOperatorActionItem>();
  for (const action of actions) {
    actionById.set(action.actionId, action);
  }

  // Filter decisions to the requested business
  const businessDecisions = decisions.filter(
    (d) => d.business === options.business,
  );

  let eventsWritten = 0;
  let eventsSkipped = 0;
  let eligible = 0;

  for (const decision of businessDecisions) {
    const action = actionById.get(decision.action_id);
    if (!action?.candidateId) {
      // No candidate link — not a self-evolving review
      continue;
    }

    eligible++;

    if (options.write === false) {
      // dry-run: count but don't write
      eventsWritten++;
      continue;
    }

    const reviewDecision = mapDecision(decision.decision);
    const event = createLifecycleEvent({
      correlation_id: action.candidateId,
      event_type: "operator_review_recorded",
      lifecycle: {
        candidate_id: action.candidateId,
        review: {
          decision: reviewDecision,
          rationale: `Operator action ${action.actionId} marked as ${decision.decision}`,
          reviewer_type: "operator",
          reviewer_id: decision.actor_id,
          reviewed_at: decision.decided_at,
        },
      },
      run_id: stableHash(`${action.actionId}|operator-review-run`).slice(0, 16),
      session_id: stableHash(`${action.actionId}|${decision.decided_at}|operator-review-session`).slice(
        0,
        16,
      ),
      source_component: "lp-do-ideas-operator-review-reconcile",
      timestamp: decision.decided_at,
      artifact_refs: [action.sourcePath],
    });

    const result = appendSelfEvolvingEvent(
      options.rootDir,
      options.business,
      event,
    );

    if (result.written) {
      eventsWritten++;
    } else {
      eventsSkipped++;
    }
  }

  return {
    ok: true,
    decisions_scanned: businessDecisions.length,
    eligible_decisions: eligible,
    events_written: eventsWritten,
    events_skipped_duplicate: eventsSkipped,
  };
}

// CLI entry point
if (process.argv[1]?.includes("lp-do-ideas-operator-review-reconcile")) {
  const args = process.argv.slice(2);

  const rootDir = process.cwd();
  const business = args.find((a) => a.startsWith("--business="))?.split("=")[1] ?? "BRIK";
  const dryRun = args.includes("--dry-run");

  try {
    const result = runOperatorReviewReconcile({
      rootDir,
      business,
      write: !dryRun,
    });

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("operator-review-reconcile failed:", err);
    process.exit(1);
  }
}
