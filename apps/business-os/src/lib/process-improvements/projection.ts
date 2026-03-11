import { createHash } from "node:crypto";
import path from "node:path";

import { getRepoRoot } from "@/lib/get-repo-root";
import { readFileWithinRoot } from "@/lib/safe-fs";

import {
  type ProcessImprovementsDecisionEvent,
  readProcessImprovementsDecisionEvents,
  reduceProcessImprovementsDecisionEvents,
} from "./decision-ledger";
import {
  type ProcessImprovementsQueueMode,
  resolveProcessImprovementsQueuePath,
} from "./queue-path";

export type ProcessImprovementsDecisionType = "do" | "defer" | "decline";
export type ProcessImprovementsExecutionResult =
  | "pending"
  | "succeeded"
  | "failed";

export interface ProcessImprovementsDecisionState {
  decision: ProcessImprovementsDecisionType;
  decidedAt: string;
  deferUntil?: string;
  executionResult?: ProcessImprovementsExecutionResult;
  executionError?: string;
}

export interface ProcessImprovementsInboxItem {
  ideaKey: string;
  dispatchId: string;
  business: string;
  title: string;
  body: string;
  queueState: string;
  status?: string;
  recommendedRoute?: string;
  priority?: string;
  confidence?: number;
  createdAt?: string;
  currentTruth?: string;
  nextScopeNow?: string;
  locationAnchors: string[];
  sourcePath: string;
  queueMode: ProcessImprovementsQueueMode;
  decisionState?: ProcessImprovementsDecisionState;
}

export interface ProcessImprovementsActionedItem {
  ideaKey: string;
  dispatchId: string;
  business: string;
  title: string;
  decision: "do" | "decline";
  decidedAt: string;
  actorName: string;
  executionResult?: ProcessImprovementsExecutionResult;
}

export interface ProcessImprovementsProjectionResult {
  queueMode: ProcessImprovementsQueueMode;
  sourcePath: string;
  items: ProcessImprovementsInboxItem[];
  actionedItems: ProcessImprovementsActionedItem[];
}

export interface LoadProcessImprovementsProjectionOptions {
  repoRoot?: string;
  env?: NodeJS.ProcessEnv;
  /** Override both decision states and events (test mode). When provided, actionedItems will be empty. */
  decisionStates?: ReadonlyMap<string, ProcessImprovementsDecisionState>;
  /** Override raw decision events (test mode). Takes precedence over decisionStates for actionedItems. */
  decisionEvents?: readonly ProcessImprovementsDecisionEvent[];
}

interface QueueDispatchRecord {
  dispatch_id?: string;
  business?: string;
  area_anchor?: string;
  current_truth?: string;
  why?: string;
  next_scope_now?: string;
  location_anchors?: unknown;
  queue_state?: string;
  status?: string;
  recommended_route?: string;
  priority?: string;
  confidence?: number;
  created_at?: string;
}

interface QueueStateRecord {
  dispatches?: QueueDispatchRecord[];
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => readString(entry))
    .filter((entry): entry is string => entry !== undefined);
}

function isQueueStateRecord(value: unknown): value is QueueStateRecord {
  return typeof value === "object" && value !== null;
}

export function deriveProcessImprovementsIdeaKey(
  sourcePath: string,
  dispatchId: string
): string {
  return createHash("sha1")
    .update(`${sourcePath}::${dispatchId}`)
    .digest("hex");
}

/**
 * Process improvements is app-authoritative.
 * Generated report artifacts are downstream read-only outputs and must not be
 * used as the inbox source of truth.
 */
export function projectProcessImprovementsInboxItems(
  queueState: QueueStateRecord,
  sourcePath: string,
  queueMode: ProcessImprovementsQueueMode,
  decisionStates: ReadonlyMap<string, ProcessImprovementsDecisionState> = new Map()
): ProcessImprovementsInboxItem[] {
  const dispatches = Array.isArray(queueState.dispatches)
    ? queueState.dispatches
    : [];
  const items: Array<ProcessImprovementsInboxItem | null> = dispatches
    .filter((dispatch) => dispatch.queue_state === "enqueued")
    .map((dispatch) => {
      const dispatchId = readString(dispatch.dispatch_id);
      if (!dispatchId) {
        return null;
      }

      const title =
        readString(dispatch.area_anchor) ??
        readString(dispatch.current_truth) ??
        dispatchId;

      const sourceIdeaKey = deriveProcessImprovementsIdeaKey(
        sourcePath,
        dispatchId
      );

      const item: ProcessImprovementsInboxItem = {
        ideaKey: sourceIdeaKey,
        dispatchId,
        business: readString(dispatch.business) ?? "BOS",
        title,
        body:
          readString(dispatch.why) ??
          readString(dispatch.current_truth) ??
          "No summary available.",
        queueState: readString(dispatch.queue_state) ?? "enqueued",
        status: readString(dispatch.status),
        recommendedRoute: readString(dispatch.recommended_route),
        priority: readString(dispatch.priority),
        confidence:
          typeof dispatch.confidence === "number" ? dispatch.confidence : undefined,
        createdAt: readString(dispatch.created_at),
        currentTruth: readString(dispatch.current_truth),
        nextScopeNow: readString(dispatch.next_scope_now),
        locationAnchors: readStringArray(dispatch.location_anchors),
        sourcePath,
        queueMode,
        decisionState: decisionStates.get(sourceIdeaKey),
      };

      return item;
    });

  return items
    .filter(
      (item): item is ProcessImprovementsInboxItem => item !== null
    )
    .sort((left, right) => {
      const rightCreated = right.createdAt ?? "";
      const leftCreated = left.createdAt ?? "";
      return (
        rightCreated.localeCompare(leftCreated) ||
        left.dispatchId.localeCompare(right.dispatchId)
      );
    });
}

/**
 * Build the actioned-items history by cross-referencing ledger events with
 * queue dispatch titles. Reads ALL dispatches (not just "enqueued") so titles
 * remain resolvable after items leave the inbox.
 *
 * Returns the most recent "do" or "decline" event per idea, sorted newest-first.
 */
export function projectProcessImprovementsActionedItems(
  queueState: QueueStateRecord,
  events: readonly ProcessImprovementsDecisionEvent[],
  sourcePath: string
): ProcessImprovementsActionedItem[] {
  // Build dispatch_id → title from every dispatch in the queue file
  const dispatches = Array.isArray(queueState.dispatches)
    ? queueState.dispatches
    : [];
  const titleByDispatchId = new Map<string, string>();
  for (const dispatch of dispatches) {
    const dispatchId = readString(dispatch.dispatch_id);
    if (!dispatchId) continue;
    titleByDispatchId.set(
      dispatchId,
      readString(dispatch.area_anchor) ??
        readString(dispatch.current_truth) ??
        dispatchId
    );
  }

  // Keep the latest event per idea_key for actionable decisions only
  const latestByIdeaKey = new Map<string, ProcessImprovementsDecisionEvent>();
  for (const event of events) {
    if (event.decision !== "do" && event.decision !== "decline") continue;
    const existing = latestByIdeaKey.get(event.idea_key);
    if (!existing || event.decided_at > existing.decided_at) {
      latestByIdeaKey.set(event.idea_key, event);
    }
  }

  return Array.from(latestByIdeaKey.values())
    .map(
      (event): ProcessImprovementsActionedItem => ({
        ideaKey: event.idea_key,
        dispatchId: event.dispatch_id,
        business: event.business,
        title:
          titleByDispatchId.get(event.dispatch_id) ??
          deriveProcessImprovementsIdeaKey(sourcePath, event.dispatch_id),
        decision: event.decision as "do" | "decline",
        decidedAt: event.decided_at,
        actorName: event.actor_name,
        executionResult: event.execution_result,
      })
    )
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
}

export async function loadProcessImprovementsProjection(
  options: LoadProcessImprovementsProjectionOptions = {}
): Promise<ProcessImprovementsProjectionResult> {
  const repoRoot = options.repoRoot ?? getRepoRoot();
  const queuePath = resolveProcessImprovementsQueuePath(options.env);
  const absoluteQueuePath = path.join(repoRoot, queuePath.relativePath);

  // Resolve decision states and events. When decisionStates is provided
  // directly (test override), skip reading events and return no history.
  let decisionStates: ReadonlyMap<string, ProcessImprovementsDecisionState>;
  let decisionEvents: readonly ProcessImprovementsDecisionEvent[];

  if (options.decisionStates) {
    decisionStates = options.decisionStates;
    decisionEvents = options.decisionEvents ?? [];
  } else if (options.decisionEvents) {
    decisionEvents = options.decisionEvents;
    decisionStates = reduceProcessImprovementsDecisionEvents([
      ...decisionEvents,
    ]);
  } else {
    decisionEvents = await readProcessImprovementsDecisionEvents(repoRoot);
    decisionStates = reduceProcessImprovementsDecisionEvents([
      ...decisionEvents,
    ]);
  }

  let raw: string;
  try {
    raw = (await readFileWithinRoot(
      repoRoot,
      absoluteQueuePath,
      "utf-8"
    )) as string;
  } catch {
    return {
      queueMode: queuePath.queueMode,
      sourcePath: queuePath.relativePath,
      items: [],
      actionedItems: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      queueMode: queuePath.queueMode,
      sourcePath: queuePath.relativePath,
      items: [],
      actionedItems: [],
    };
  }

  if (!isQueueStateRecord(parsed)) {
    return {
      queueMode: queuePath.queueMode,
      sourcePath: queuePath.relativePath,
      items: [],
      actionedItems: [],
    };
  }

  return {
    queueMode: queuePath.queueMode,
    sourcePath: queuePath.relativePath,
    items: projectProcessImprovementsInboxItems(
      parsed,
      queuePath.relativePath,
      queuePath.queueMode,
      decisionStates
    ),
    actionedItems: projectProcessImprovementsActionedItems(
      parsed,
      decisionEvents,
      queuePath.relativePath
    ),
  };
}
