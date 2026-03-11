import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  QueueDeclinedBy,
  QueueDispatch,
} from "./lp-do-ideas-queue-state-file.js";
import {
  atomicWriteQueueState,
  buildCounts,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";
import type {
  BriefingInvocationPayload,
  FactFindInvocationPayload,
  InvocationPayload,
  MicroBuildInvocationPayload,
  PlanInvocationPayload,
} from "./lp-do-ideas-routing-adapter.js";
import { routeDispatch } from "./lp-do-ideas-routing-adapter.js";
import { markDispatchesProcessed } from "./lp-do-ideas-work-packages.js";

export interface DoOperatorActionOptions {
  dispatchId: string;
  queueStatePath: string;
  actorId: string;
  actorName: string;
  rootDir?: string;
  clock?: () => Date;
}

export interface DeclineOperatorActionOptions {
  dispatchId: string;
  queueStatePath: string;
  actorId: string;
  actorName: string;
  reason?: string;
  rootDir?: string;
  clock?: () => Date;
}

type OperatorActionFailureReason =
  | "file_not_found"
  | "parse_error"
  | "write_error"
  | "no_match"
  | "conflict"
  | "invalid_dispatch";

export type DoOperatorActionResult =
  | {
      ok: true;
      dispatchId: string;
      targetRoute: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
      targetKind: "fact-find" | "plan" | "build" | "briefing";
      targetSlug: string;
      targetPath: string;
      queueStatePath: string;
      created: boolean;
    }
  | {
      ok: false;
      reason: OperatorActionFailureReason;
      error?: string;
    };

export type DeclineOperatorActionResult =
  | {
      ok: true;
      dispatchId: string;
      queueStatePath: string;
      declinedAt: string;
      skipped: boolean;
    }
  | {
      ok: false;
      reason: OperatorActionFailureReason;
      error?: string;
    };

type TargetKind = "fact-find" | "plan" | "build" | "briefing";

function resolveRootDir(inputRootDir: string | undefined): string {
  if (inputRootDir) {
    return inputRootDir;
  }

  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveTargetSlug(
  dispatch: QueueDispatch,
  payload: InvocationPayload
): string {
  const processedBy = readRecord(dispatch.processed_by);
  const candidates = [
    readString(processedBy?.target_slug),
    readString(processedBy?.fact_find_slug),
    readString(dispatch.feature_slug),
    payload.skill === "lp-do-build" ? payload.feature_slug_hint : undefined,
    readString(dispatch.anchor_key),
    normalizeSlug(payload.area_anchor),
    normalizeSlug(payload.dispatch_id),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeSlug(candidate);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "process-improvement";
}

function resolveTarget(payload: InvocationPayload, targetSlug: string) {
  if (payload.skill === "lp-do-build") {
    return {
      targetRoute: "lp-do-build" as const,
      targetKind: "build" as const,
      targetPath: `docs/plans/${targetSlug}/micro-build.md`,
    };
  }

  if (payload.skill === "lp-do-plan") {
    return {
      targetRoute: "lp-do-plan" as const,
      targetKind: "plan" as const,
      targetPath: `docs/plans/${targetSlug}/plan.md`,
    };
  }

  if (payload.skill === "lp-do-briefing") {
    return {
      targetRoute: "lp-do-briefing" as const,
      targetKind: "briefing" as const,
      targetPath: `docs/plans/${targetSlug}/briefing.md`,
    };
  }

  return {
    targetRoute: "lp-do-fact-find" as const,
    targetKind: "fact-find" as const,
    targetPath: `docs/plans/${targetSlug}/fact-find.md`,
  };
}

function outcomeContractLines(payload: InvocationPayload): string[] {
  const intendedOutcome = payload.intended_outcome;
  return [
    `- **Why:** ${payload.why ?? "TBD"}`,
    `- **Intended Outcome Type:** ${intendedOutcome?.type ?? "TBD"}`,
    `- **Intended Outcome Statement:** ${intendedOutcome?.statement ?? "TBD"}`,
    `- **Source:** ${intendedOutcome?.source ?? payload.why_source ?? "auto"}`,
  ];
}

function locationAnchorLines(locationAnchors: readonly string[]): string[] {
  return locationAnchors.length > 0
    ? locationAnchors.map((anchor) => `- \`${anchor}\` - source location anchor`)
    : ["- None: queued dispatch did not include location anchors"];
}

function evidenceRefLines(evidenceRefs: readonly string[]): string[] {
  return evidenceRefs.length > 0
    ? evidenceRefs.map((ref) => `- ${ref}`)
    : ["- None: queued dispatch did not include evidence refs"];
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFactFindContent(
  payload: FactFindInvocationPayload,
  targetSlug: string,
  today: string
): string {
  const featureName = titleFromSlug(targetSlug);
  return [
    "---",
    "Type: Fact-Find",
    "Outcome: Planning",
    "Status: Draft",
    "Domain: BOS | Startup Loop",
    "Workstream: Operations",
    `Created: ${today}`,
    `Last-updated: ${today}`,
    `Feature-Slug: ${targetSlug}`,
    "Execution-Track: mixed",
    "Deliverable-Family: multi",
    "Deliverable-Channel: none",
    "Deliverable-Subtype: none",
    "Deliverable-Type: multi-deliverable",
    "Startup-Deliverable-Alias: none",
    "Primary-Execution-Skill: lp-do-build",
    "Supporting-Skills: none",
    `Related-Plan: docs/plans/${targetSlug}/plan.md`,
    `Dispatch-ID: ${payload.dispatch_id}`,
    `Trigger-Why: ${payload.why ?? "TBD"}`,
    `Trigger-Intended-Outcome: type: ${payload.intended_outcome?.type ?? "TBD"} | statement: ${payload.intended_outcome?.statement ?? "TBD"} | source: ${payload.intended_outcome?.source ?? payload.why_source ?? "auto"}`,
    "---",
    "",
    `# ${featureName} Fact-Find Brief`,
    "",
    "## Scope",
    "### Summary",
    payload.source_packet.next_scope_now ?? payload.area_anchor,
    "",
    "### Goals",
    `- Validate the queued change around ${payload.area_anchor}.`,
    `- Trace the affected seams listed in the dispatch payload.`,
    "",
    "### Non-goals",
    "- Deliver implementation changes in this artifact.",
    "- Change the dispatch route without new evidence.",
    "",
    "### Constraints & Assumptions",
    "- Constraints:",
    "  - This brief was created from a queue-backed operator action.",
    "  - Queue route and source evidence should remain authoritative unless disproven.",
    "- Assumptions:",
    `  - The queued route ${payload.skill} remains the correct next step.`,
    "",
    "## Outcome Contract",
    "",
    ...outcomeContractLines(payload),
    "",
    "## Evidence Audit (Current State)",
    "### Entry Points",
    ...locationAnchorLines(payload.location_anchors),
    "",
    "### Data & Contracts",
    "- Evidence refs:",
    ...evidenceRefLines(payload.evidence_refs),
    "",
    "## Dispatch Handoff",
    `- Dispatch ID: ${payload.dispatch_id}`,
    `- Business: ${payload.business}`,
    `- Created At: ${payload.dispatch_created_at}`,
    `- Provisional Deliverable Family: ${payload.provisional_deliverable_family}`,
    "",
  ].join("\n");
}

function buildPlanContent(
  payload: PlanInvocationPayload,
  targetSlug: string,
  today: string
): string {
  const featureName = titleFromSlug(targetSlug);
  return [
    "---",
    "Type: Plan",
    "Status: Draft",
    "Domain: BOS | Startup Loop",
    "Workstream: Operations",
    `Created: ${today}`,
    `Last-reviewed: ${today}`,
    `Last-updated: ${today}`,
    "Relates-to charter: docs/business-os/business-os-charter.md",
    `Feature-Slug: ${targetSlug}`,
    "Deliverable-Type: multi-deliverable",
    "Startup-Deliverable-Alias: none",
    "Execution-Track: mixed",
    "Primary-Execution-Skill: lp-do-build",
    "Supporting-Skills: none",
    "Overall-confidence: 80%",
    "Confidence-Method: seeded from queued operator handoff",
    "Auto-Build-Intent: plan-only",
    "---",
    "",
    `# ${featureName} Plan`,
    "",
    "## Summary",
    payload.source_packet.next_scope_now ?? payload.area_anchor,
    "",
    "## Active tasks",
    "- [ ] TASK-01: Expand this seeded plan into an executable implementation sequence",
    "",
    "## Goals",
    `- Preserve the queued intent for ${payload.area_anchor}.`,
    "- Convert the routed dispatch into a fully executable plan.",
    "",
    "## Non-goals",
    "- Reclassifying the queued route without new evidence.",
    "",
    "## Constraints & Assumptions",
    "- Constraints:",
    "  - This plan was created from a queue-backed operator action.",
    "- Assumptions:",
    `  - The queued route ${payload.skill} is still valid.`,
    "",
    "## Inherited Outcome Contract",
    "",
    ...outcomeContractLines(payload),
    "",
    "## Dispatch Handoff",
    `- Dispatch ID: ${payload.dispatch_id}`,
    `- Business: ${payload.business}`,
    `- Created At: ${payload.dispatch_created_at}`,
    `- Provisional Deliverable Family: ${payload.provisional_deliverable_family}`,
    "",
    "## Evidence Seed",
    ...evidenceRefLines(payload.evidence_refs),
    "",
  ].join("\n");
}

function buildMicroBuildContent(
  payload: MicroBuildInvocationPayload,
  targetSlug: string,
  today: string
): string {
  const featureName = titleFromSlug(targetSlug);
  return [
    "---",
    "Type: Micro-Build",
    "Status: Active",
    `Created: ${today}`,
    `Last-updated: ${today}`,
    `Feature-Slug: ${targetSlug}`,
    "Execution-Track: mixed",
    "Deliverable-Type: multi-deliverable",
    "artifact: micro-build",
    `Dispatch-ID: ${payload.dispatch_id}`,
    "Related-Plan: none",
    "---",
    "",
    `# ${featureName} Micro-Build`,
    "",
    "## Scope",
    `- Change: ${payload.source_packet.next_scope_now ?? payload.area_anchor}`,
    "- Non-goals: route changes, planning expansion, or unrelated cleanup",
    "",
    "## Execution Contract",
    `- Affects: ${payload.location_anchors.join(", ") || "None recorded"}`,
    `- Acceptance checks: execute the bounded change implied by ${payload.area_anchor}`,
    "- Validation commands: fill during execution",
    "- Rollback note: revert the bounded change if validation fails",
    "",
    "## Outcome Contract",
    ...outcomeContractLines(payload),
    "",
  ].join("\n");
}

function buildBriefingContent(
  payload: BriefingInvocationPayload,
  targetSlug: string,
  today: string
): string {
  const featureName = titleFromSlug(targetSlug);
  return [
    "---",
    "Type: Briefing",
    "Outcome: Understanding",
    "Status: Active",
    "Domain: BOS | Startup Loop",
    `Created: ${today}`,
    `Last-updated: ${today}`,
    `Topic-Slug: ${targetSlug}`,
    "---",
    "",
    `# ${featureName} Briefing`,
    "",
    "## Executive Summary",
    payload.source_packet.next_scope_now ?? payload.area_anchor,
    "",
    "## Questions Answered",
    `- What is happening around ${payload.area_anchor}?`,
    "- Which modules and evidence refs are relevant?",
    "- What should downstream work understand before planning or building?",
    "",
    "## Source Anchors",
    ...locationAnchorLines(payload.location_anchors),
    "",
    "## Evidence Refs",
    ...evidenceRefLines(payload.evidence_refs),
    "",
    "## Outcome Contract",
    ...outcomeContractLines(payload),
    "",
  ].join("\n");
}

function buildArtifactContent(
  payload: InvocationPayload,
  targetSlug: string,
  today: string
): string {
  if (payload.skill === "lp-do-build") {
    return buildMicroBuildContent(payload, targetSlug, today);
  }

  if (payload.skill === "lp-do-plan") {
    return buildPlanContent(payload, targetSlug, today);
  }

  if (payload.skill === "lp-do-briefing") {
    return buildBriefingContent(payload, targetSlug, today);
  }

  return buildFactFindContent(payload, targetSlug, today);
}

function writeNewArtifact(
  rootDir: string,
  relativePath: string,
  content: string
): { ok: true; created: boolean } | { ok: false; reason: "conflict" | "write_error"; error: string } {
  const absolutePath = path.join(rootDir, relativePath);
  if (existsSync(absolutePath)) {
    return {
      ok: false,
      reason: "conflict",
      error: `Target artifact already exists: ${relativePath}`,
    };
  }

  try {
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `${content.trimEnd()}\n`, {
      encoding: "utf-8",
      flag: "wx",
    });
  } catch (error) {
    return {
      ok: false,
      reason: "write_error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true, created: true };
}

function findDispatch(
  dispatches: QueueDispatch[],
  dispatchId: string
): QueueDispatch | null {
  for (const dispatch of dispatches) {
    if (dispatch.dispatch_id === dispatchId) {
      return dispatch;
    }
  }

  return null;
}

export function handoffQueuedIdeaToRegularProcess(
  options: DoOperatorActionOptions
): DoOperatorActionResult {
  const rootDir = resolveRootDir(options.rootDir);
  const clock = options.clock ?? (() => new Date());
  const queueResult = readQueueStateFile(options.queueStatePath);
  if (!queueResult.ok) {
    return queueResult;
  }

  const dispatch = findDispatch(queueResult.queue.dispatches, options.dispatchId);
  if (!dispatch) {
    return { ok: false, reason: "no_match" };
  }

  if (dispatch.queue_state !== "enqueued") {
    return {
      ok: false,
      reason: "conflict",
      error:
        `Dispatch ${options.dispatchId} is in queue_state=${dispatch.queue_state ?? "unknown"} ` +
        "and cannot be handed off again.",
    };
  }

  const routeResult = routeDispatch(dispatch as never);
  if (!routeResult.ok) {
    return {
      ok: false,
      reason: "invalid_dispatch",
      error: routeResult.error,
    };
  }

  const targetSlug = deriveTargetSlug(dispatch, routeResult.payload);
  const target = resolveTarget(routeResult.payload, targetSlug);
  const today = clock().toISOString().slice(0, 10);
  const artifactResult = writeNewArtifact(
    rootDir,
    target.targetPath,
    buildArtifactContent(routeResult.payload, targetSlug, today)
  );

  if (!artifactResult.ok) {
    return artifactResult;
  }

  const markResult = markDispatchesProcessed({
    queueStatePath: options.queueStatePath,
    dispatchIds: [options.dispatchId],
    targetSlug,
    targetPath: target.targetPath,
    targetRoute: target.targetRoute,
    route: "dispatch-routed",
    business: readString(dispatch.business),
    clock,
  });

  if (!markResult.ok) {
    return markResult;
  }

  return {
    ok: true,
    dispatchId: options.dispatchId,
    targetRoute: target.targetRoute,
    targetKind: target.targetKind,
    targetSlug,
    targetPath: target.targetPath,
    queueStatePath: options.queueStatePath,
    created: artifactResult.created,
  };
}

export function declineQueuedIdea(
  options: DeclineOperatorActionOptions
): DeclineOperatorActionResult {
  const clock = options.clock ?? (() => new Date());
  const queueResult = readQueueStateFile(options.queueStatePath);
  if (!queueResult.ok) {
    return queueResult;
  }

  const dispatch = findDispatch(queueResult.queue.dispatches, options.dispatchId);
  if (!dispatch) {
    return { ok: false, reason: "no_match" };
  }

  if (dispatch.queue_state === "declined") {
    return {
      ok: true,
      dispatchId: options.dispatchId,
      queueStatePath: options.queueStatePath,
      declinedAt:
        readString(dispatch.declined_by?.declined_at) ?? clock().toISOString(),
      skipped: true,
    };
  }

  if (dispatch.queue_state && dispatch.queue_state !== "enqueued") {
    return {
      ok: false,
      reason: "conflict",
      error:
        `Dispatch ${options.dispatchId} is in queue_state=${dispatch.queue_state} ` +
        "and cannot be declined from the operator inbox.",
    };
  }

  const declinedAt = clock().toISOString();
  const declinedBy: QueueDeclinedBy = {
    actor_id: options.actorId,
    actor_name: options.actorName,
    declined_at: declinedAt,
    reason: options.reason ?? "Declined by operator",
  };

  dispatch.queue_state = "declined";
  dispatch.status = "declined";
  dispatch.declined_by = declinedBy;
  delete dispatch.processed_by;
  delete dispatch.completed_by;

  queueResult.queue.counts = buildCounts(queueResult.queue.dispatches);
  queueResult.queue.last_updated = declinedAt;

  const writeResult = atomicWriteQueueState(
    options.queueStatePath,
    queueResult.queue
  );
  if (!writeResult.ok) {
    return { ok: false, reason: "write_error", error: writeResult.error };
  }

  return {
    ok: true,
    dispatchId: options.dispatchId,
    queueStatePath: options.queueStatePath,
    declinedAt,
    skipped: false,
  };
}
