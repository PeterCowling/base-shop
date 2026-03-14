import { createHash } from "node:crypto";
import path from "node:path";

import { getRepoRoot } from "@/lib/get-repo-root";
import { readFileWithinRoot } from "@/lib/safe-fs";

import {
  type CanonicalOperatorActionItem,
  type CanonicalOperatorActionKind,
  OPERATOR_ACTIONS_RELATIVE_PATH,
  parseCanonicalOperatorActionItemsFromJson,
} from "../../../../../scripts/src/startup-loop/operator-actions-contract";

import { type DecisionBrief, projectDecisionBrief } from "./decision-brief";
import {
  loadProcessImprovementsDecisionStates,
  readProcessImprovementsDecisionEvents,
} from "./decision-ledger";
import {
  loadProcessImprovementsOperatorActionDecisionStates,
  type ProcessImprovementsOperatorActionDecisionState,
  readProcessImprovementsOperatorActionDecisionEvents,
} from "./operator-actions-ledger";
import {
  type ProcessImprovementsQueueMode,
  resolveProcessImprovementsQueuePath,
} from "./queue-path";

export type ProcessImprovementsDecisionType = "do" | "defer" | "decline";
export type ProcessImprovementsExecutionResult =
  | "pending"
  | "succeeded"
  | "failed";
export type ProcessImprovementsItemType =
  | "process_improvement"
  | "operator_action";
export type ProcessImprovementsOperatorActionKind = CanonicalOperatorActionKind;
export type ProcessImprovementsRecentActionDecision = "do" | "decline" | "done";
export type ProcessImprovementsWorkItemDecisionType =
  | ProcessImprovementsDecisionType
  | "done"
  | "snooze";
export type ProcessImprovementsWorkItemStatusGroup =
  | "active"
  | "deferred"
  | "resolved";
export type ProcessImprovementsWorkItemActionVariant =
  | "primary"
  | "secondary"
  | "danger";

export interface ProcessImprovementsWorkItemDecisionState {
  decision: ProcessImprovementsWorkItemDecisionType;
  decidedAt: string;
  deferUntil?: string;
  snoozeUntil?: string;
  executionResult?: ProcessImprovementsExecutionResult;
  executionError?: string;
}

export interface ProcessImprovementsDecisionState {
  decision: ProcessImprovementsDecisionType;
  decidedAt: string;
  deferUntil?: string;
  executionResult?: ProcessImprovementsExecutionResult;
  executionError?: string;
  rationale?: string;
}

export interface ProcessImprovementsWorkItemAction {
  decision: ProcessImprovementsWorkItemDecisionType;
  label: string;
  variant: ProcessImprovementsWorkItemActionVariant;
}

interface ProcessImprovementsWorkItemBase {
  itemKey: string;
  itemType: ProcessImprovementsItemType;
  business: string;
  title: string;
  body: string;
  sourcePath: string;
  statusGroup: ProcessImprovementsWorkItemStatusGroup;
  stateLabel: string;
  priorityBand: number;
  priorityReason: string;
  isOverdue: boolean;
  dueAt?: string;
  createdAt?: string;
  owner?: string;
  sourceLabel?: string;
  locationAnchors: string[];
  availableActions: ProcessImprovementsWorkItemAction[];
  decisionState?: ProcessImprovementsWorkItemDecisionState;
  decisionBrief?: DecisionBrief;
}

export interface ProcessImprovementQueueInboxItem
  extends ProcessImprovementsWorkItemBase {
  itemType: "process_improvement";
  ideaKey: string;
  dispatchId: string;
  queueState: string;
  status?: string;
  recommendedRoute?: string;
  priority?: string;
  confidence?: number;
  evidenceRefs?: string[];
  currentTruth?: string;
  nextScopeNow?: string;
  queueMode: ProcessImprovementsQueueMode;
}

export interface ProcessImprovementsOperatorActionItem
  extends ProcessImprovementsWorkItemBase {
  itemType: "operator_action";
  actionId: string;
  actionKind: ProcessImprovementsOperatorActionKind;
  sourceLabel?: string;
}

export type ProcessImprovementsWorkItem =
  | ProcessImprovementQueueInboxItem
  | ProcessImprovementsOperatorActionItem;

export type ProcessImprovementsInboxItem = ProcessImprovementsWorkItem;

export interface ProcessImprovementsProjectionResult {
  queueMode: ProcessImprovementsQueueMode;
  queueSourcePath: string;
  operatorActionsSourcePath: string;
  items: ProcessImprovementsWorkItem[];
  recentActions: ProcessImprovementsRecentAction[];
  completedIdeasCount: number;
}

export interface ProcessImprovementsRecentAction {
  itemKey: string;
  title: string;
  business: string;
  decision: ProcessImprovementsRecentActionDecision;
  actedAt: string;
  targetPath?: string;
  itemType: ProcessImprovementsItemType;
  rationale?: string;
}

export interface LoadProcessImprovementsProjectionOptions {
  repoRoot?: string;
  env?: NodeJS.ProcessEnv;
  decisionStates?: ReadonlyMap<string, ProcessImprovementsDecisionState>;
  operatorActionDecisionStates?: ReadonlyMap<
    string,
    ProcessImprovementsOperatorActionDecisionState
  >;
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
  evidence_refs?: unknown;
  created_at?: string;
}

interface QueueStateRecord {
  dispatches?: QueueDispatchRecord[];
}

const QUEUE_ACTIONS: ProcessImprovementsWorkItemAction[] = [
  { decision: "do", label: "Do", variant: "primary" },
  { decision: "defer", label: "Defer", variant: "secondary" },
  { decision: "decline", label: "Decline", variant: "danger" },
];

const OPERATOR_ACTIONS_ACTIVE: ProcessImprovementsWorkItemAction[] = [
  { decision: "done", label: "Mark done", variant: "primary" },
  { decision: "snooze", label: "Snooze", variant: "secondary" },
];

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

function getPriorityRank(priority: string | undefined): number {
  switch (priority) {
    case "P1":
      return 0;
    case "P2":
      return 1;
    case "P3":
      return 2;
    default:
      return 3;
  }
}

function isDeferredDecisionActive(
  decisionState: ProcessImprovementsDecisionState | undefined,
  now: Date
): boolean {
  if (
    decisionState?.decision !== "defer" ||
    !decisionState.deferUntil
  ) {
    return false;
  }

  const until = Date.parse(decisionState.deferUntil);
  return Number.isFinite(until) && until > now.getTime();
}

function isOperatorSnoozed(
  decisionState: ProcessImprovementsOperatorActionDecisionState | undefined,
  now: Date
): boolean {
  if (
    decisionState?.decision !== "snooze" ||
    !decisionState.snoozeUntil
  ) {
    return false;
  }

  const until = Date.parse(decisionState.snoozeUntil);
  return Number.isFinite(until) && until > now.getTime();
}

function isQueueDecisionState(
  decisionState:
    | ProcessImprovementsDecisionState
    | ProcessImprovementsWorkItemDecisionState
    | undefined
): decisionState is ProcessImprovementsDecisionState {
  return (
    !!decisionState &&
    (decisionState.decision === "do" ||
      decisionState.decision === "defer" ||
      decisionState.decision === "decline")
  );
}

function isOperatorActionDecisionState(
  decisionState:
    | ProcessImprovementsDecisionState
    | ProcessImprovementsOperatorActionDecisionState
    | undefined
): decisionState is ProcessImprovementsOperatorActionDecisionState {
  return (
    !!decisionState &&
    (decisionState.decision === "done" || decisionState.decision === "snooze")
  );
}

function getOperatorPriorityBand(
  item: CanonicalOperatorActionItem,
  statusGroup: ProcessImprovementsWorkItemStatusGroup
): number {
  if (statusGroup === "resolved") {
    return 90;
  }

  if (statusGroup === "deferred") {
    return 80;
  }

  if (item.isOverdue) {
    return 0;
  }

  switch (item.actionKind) {
    case "stage_gate":
      return 10;
    case "blocker":
      return 20;
    case "decision_waiting":
      return 30;
    case "next_step":
      return 40;
    default:
      return 50;
  }
}

function getOperatorPriorityReason(
  item: CanonicalOperatorActionItem,
  statusGroup: ProcessImprovementsWorkItemStatusGroup
): string {
  if (statusGroup === "resolved") {
    return "Resolved operator action";
  }

  if (statusGroup === "deferred") {
    return "Snoozed operator action";
  }

  if (item.isOverdue) {
    return `Overdue ${item.actionKind.replace(/_/g, " ")}`;
  }

  return `Active ${item.actionKind.replace(/_/g, " ")}`;
}

function getQueuePriorityBand(
  item: Pick<
    ProcessImprovementQueueInboxItem,
    "priority" | "decisionState"
  >,
  now: Date
): number {
  if (isQueueDecisionState(item.decisionState) && isDeferredDecisionActive(item.decisionState, now)) {
    return 80;
  }

  return 50 + getPriorityRank(item.priority) * 10;
}

function getQueuePriorityReason(
  item: Pick<
    ProcessImprovementQueueInboxItem,
    "priority" | "decisionState"
  >,
  now: Date
): string {
  if (isQueueDecisionState(item.decisionState) && isDeferredDecisionActive(item.decisionState, now)) {
    return "Deferred queue item";
  }

  return item.priority
    ? `Queue backlog ${item.priority}`
    : "Unprioritized queue backlog";
}

function compareWorkItems(
  left: ProcessImprovementsWorkItem,
  right: ProcessImprovementsWorkItem
): number {
  if (left.priorityBand !== right.priorityBand) {
    return left.priorityBand - right.priorityBand;
  }

  if (left.isOverdue !== right.isOverdue) {
    return left.isOverdue ? -1 : 1;
  }

  const leftDue = left.dueAt ?? "9999-12-31";
  const rightDue = right.dueAt ?? "9999-12-31";
  if (leftDue !== rightDue) {
    return leftDue.localeCompare(rightDue);
  }

  const leftPriority = left.itemType === "process_improvement"
    ? getPriorityRank(left.priority)
    : 99;
  const rightPriority = right.itemType === "process_improvement"
    ? getPriorityRank(right.priority)
    : 99;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftConfidence = left.itemType === "process_improvement"
    ? left.confidence ?? -1
    : -1;
  const rightConfidence = right.itemType === "process_improvement"
    ? right.confidence ?? -1
    : -1;
  if (leftConfidence !== rightConfidence) {
    return rightConfidence - leftConfidence;
  }

  const leftCreated = left.createdAt ?? "";
  const rightCreated = right.createdAt ?? "";
  if (leftCreated !== rightCreated) {
    return rightCreated.localeCompare(leftCreated);
  }

  return (
    left.title.localeCompare(right.title) ||
    left.itemKey.localeCompare(right.itemKey)
  );
}

function sortWorkItems(
  items: ProcessImprovementsWorkItem[]
): ProcessImprovementsWorkItem[] {
  return [...items].sort(compareWorkItems);
}

export function isProcessImprovementQueueItem(
  item: ProcessImprovementsInboxItem
): item is ProcessImprovementQueueInboxItem {
  return item.itemType === "process_improvement";
}

export function isProcessImprovementsOperatorActionItem(
  item: ProcessImprovementsInboxItem
): item is ProcessImprovementsOperatorActionItem {
  return item.itemType === "operator_action";
}

export function deriveProcessImprovementsIdeaKey(
  sourcePath: string,
  dispatchId: string
): string {
  return createHash("sha1")
    .update(`${sourcePath}::${dispatchId}`)
    .digest("hex");
}

function toWorkItemDecisionState(
  decisionState:
    | ProcessImprovementsDecisionState
    | ProcessImprovementsOperatorActionDecisionState
    | undefined
): ProcessImprovementsWorkItemDecisionState | undefined {
  if (!decisionState) {
    return undefined;
  }

  if (isQueueDecisionState(decisionState)) {
    return {
      decision: decisionState.decision,
      decidedAt: decisionState.decidedAt,
      deferUntil: decisionState.deferUntil,
      executionResult: decisionState.executionResult,
      executionError: decisionState.executionError,
    };
  }

  return {
    decision: decisionState.decision,
    decidedAt: decisionState.decidedAt,
    snoozeUntil: isOperatorActionDecisionState(decisionState)
      ? decisionState.snoozeUntil
      : undefined,
  };
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
  decisionStates: ReadonlyMap<string, ProcessImprovementsDecisionState> = new Map(),
  now: Date = new Date()
): ProcessImprovementQueueInboxItem[] {
  const dispatches = Array.isArray(queueState.dispatches)
    ? queueState.dispatches
    : [];

  const items: Array<ProcessImprovementQueueInboxItem | null> = dispatches
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
      const ideaKey = deriveProcessImprovementsIdeaKey(sourcePath, dispatchId);
      const queueDecisionState = decisionStates.get(ideaKey);
      const statusGroup = isDeferredDecisionActive(queueDecisionState, now)
        ? "deferred"
        : "active";

      return {
        itemType: "process_improvement",
        itemKey: ideaKey,
        ideaKey,
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
        evidenceRefs: readStringArray(dispatch.evidence_refs),
        decisionBrief: projectDecisionBrief({
          areaAnchor: readString(dispatch.area_anchor),
          why: readString(dispatch.why),
          title,
          priority: readString(dispatch.priority),
          confidence: typeof dispatch.confidence === "number" ? dispatch.confidence : undefined,
          recommendedRoute: readString(dispatch.recommended_route),
          evidenceRefs: readStringArray(dispatch.evidence_refs),
          locationAnchors: readStringArray(dispatch.location_anchors),
        }),
        sourcePath,
        statusGroup,
        stateLabel: statusGroup === "deferred" ? "Deferred" : "Awaiting decision",
        priorityBand: getQueuePriorityBand(
          {
            priority: readString(dispatch.priority),
            decisionState: queueDecisionState,
          },
          now
        ),
        priorityReason: getQueuePriorityReason(
          {
            priority: readString(dispatch.priority),
            decisionState: queueDecisionState,
          },
          now
        ),
        isOverdue: false,
        owner: undefined,
        dueAt: undefined,
        sourceLabel: dispatchId,
        availableActions: [...QUEUE_ACTIONS],
        queueMode,
        decisionState: toWorkItemDecisionState(queueDecisionState),
      };
    });

  return sortWorkItems(
    items.filter((item): item is ProcessImprovementQueueInboxItem => item !== null)
  ) as ProcessImprovementQueueInboxItem[];
}

export function projectOperatorActionItems(
  operatorActionsRaw:
    | string
    | {
        items?: Array<Record<string, unknown>>;
      },
  sourcePath: string,
  decisionStates: ReadonlyMap<
    string,
    ProcessImprovementsOperatorActionDecisionState
  > = new Map(),
  now: Date = new Date()
): ProcessImprovementsOperatorActionItem[] {
  const projected =
    typeof operatorActionsRaw === "string"
      ? parseCanonicalOperatorActionItemsFromJson(
          operatorActionsRaw,
          sourcePath,
          decisionStates,
          now
        )
      : parseCanonicalOperatorActionItemsFromJson(
          JSON.stringify(operatorActionsRaw),
          sourcePath,
          decisionStates,
          now
        );

  const items = projected.map<ProcessImprovementsOperatorActionItem>((item) => {
    const decisionState = decisionStates.get(item.actionId);
    const statusGroup =
      decisionState?.decision === "done"
        ? "resolved"
        : isOperatorSnoozed(decisionState, now)
          ? "deferred"
          : "active";

    return {
      itemType: "operator_action",
      itemKey: item.actionId,
      actionId: item.actionId,
      actionKind: item.actionKind,
      business: item.business,
      title: item.title,
      body: item.body,
      sourcePath: item.sourcePath,
      sourceLabel: item.sourceLabel,
      statusGroup,
      stateLabel:
        statusGroup === "resolved"
          ? "Done"
          : statusGroup === "deferred"
            ? "Snoozed"
            : item.stateLabel,
      priorityBand: getOperatorPriorityBand(item, statusGroup),
      priorityReason: getOperatorPriorityReason(item, statusGroup),
      isOverdue: item.isOverdue,
      dueAt: item.dueAt,
      createdAt: undefined,
      owner: item.owner,
      locationAnchors: [],
      availableActions:
        statusGroup === "resolved" ? [] : [...OPERATOR_ACTIONS_ACTIVE],
      decisionState: toWorkItemDecisionState(decisionState),
    };
  });

  return sortWorkItems(items) as ProcessImprovementsOperatorActionItem[];
}

export async function loadProcessImprovementsProjection(
  options: LoadProcessImprovementsProjectionOptions = {}
): Promise<ProcessImprovementsProjectionResult> {
  const repoRoot = options.repoRoot ?? getRepoRoot();
  const now = new Date();
  const [decisionStates, operatorActionDecisionStates] = await Promise.all([
    options.decisionStates ??
      loadProcessImprovementsDecisionStates({ repoRoot }),
    options.operatorActionDecisionStates ??
      loadProcessImprovementsOperatorActionDecisionStates({ repoRoot }),
  ]);
  const queuePath = resolveProcessImprovementsQueuePath(options.env);
  const absoluteQueuePath = path.join(repoRoot, queuePath.relativePath);
  const absoluteOperatorActionsPath = path.join(
    repoRoot,
    OPERATOR_ACTIONS_RELATIVE_PATH
  );

  const completedIdeasCount = await loadCompletedIdeasCount(repoRoot);

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
      queueSourcePath: queuePath.relativePath,
      operatorActionsSourcePath: OPERATOR_ACTIONS_RELATIVE_PATH,
      items: await loadOperatorActionsOnly(
        absoluteOperatorActionsPath,
        repoRoot,
        operatorActionDecisionStates,
        now
      ),
      recentActions: await loadCombinedRecentDecisions(
        repoRoot,
        absoluteOperatorActionsPath,
        operatorActionDecisionStates,
        new Map()
      ),
      completedIdeasCount,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      queueMode: queuePath.queueMode,
      queueSourcePath: queuePath.relativePath,
      operatorActionsSourcePath: OPERATOR_ACTIONS_RELATIVE_PATH,
      items: await loadOperatorActionsOnly(
        absoluteOperatorActionsPath,
        repoRoot,
        operatorActionDecisionStates,
        now
      ),
      recentActions: await loadCombinedRecentDecisions(
        repoRoot,
        absoluteOperatorActionsPath,
        operatorActionDecisionStates,
        new Map()
      ),
      completedIdeasCount,
    };
  }

  if (!isQueueStateRecord(parsed)) {
    return {
      queueMode: queuePath.queueMode,
      queueSourcePath: queuePath.relativePath,
      operatorActionsSourcePath: OPERATOR_ACTIONS_RELATIVE_PATH,
      items: await loadOperatorActionsOnly(
        absoluteOperatorActionsPath,
        repoRoot,
        operatorActionDecisionStates,
        now
      ),
      recentActions: await loadCombinedRecentDecisions(
        repoRoot,
        absoluteOperatorActionsPath,
        operatorActionDecisionStates,
        new Map()
      ),
      completedIdeasCount,
    };
  }

  const operatorActionItems = await loadOperatorActionsOnly(
    absoluteOperatorActionsPath,
    repoRoot,
    operatorActionDecisionStates,
    now
  );
  const queueItems = projectProcessImprovementsInboxItems(
    parsed,
    queuePath.relativePath,
    queuePath.queueMode,
    decisionStates,
    now
  );

  return {
    queueMode: queuePath.queueMode,
    queueSourcePath: queuePath.relativePath,
    operatorActionsSourcePath: OPERATOR_ACTIONS_RELATIVE_PATH,
    items: sortWorkItems([...queueItems, ...operatorActionItems]),
    recentActions: await loadCombinedRecentDecisions(
      repoRoot,
      absoluteOperatorActionsPath,
      operatorActionDecisionStates,
      buildAllDispatchTitleMap(parsed, queuePath.relativePath)
    ),
    completedIdeasCount,
  };
}

async function loadOperatorActionsOnly(
  absoluteOperatorActionsPath: string,
  repoRoot: string,
  decisionStates: ReadonlyMap<
    string,
    ProcessImprovementsOperatorActionDecisionState
  >,
  now: Date
): Promise<ProcessImprovementsOperatorActionItem[]> {
  let raw: string;
  try {
    raw = (await readFileWithinRoot(
      repoRoot,
      absoluteOperatorActionsPath,
      "utf-8"
    )) as string;
  } catch {
    return [];
  }

  return projectOperatorActionItems(
    raw,
    OPERATOR_ACTIONS_RELATIVE_PATH,
    decisionStates,
    now
  );
}

async function loadRecentOperatorActionCompletions(
  repoRoot: string,
  absoluteOperatorActionsPath: string,
  decisionStates: ReadonlyMap<
    string,
    ProcessImprovementsOperatorActionDecisionState
  >
): Promise<ProcessImprovementsRecentAction[]> {
  const [events, operatorItems] = await Promise.all([
    readProcessImprovementsOperatorActionDecisionEvents(repoRoot),
    loadOperatorActionsOnly(
      absoluteOperatorActionsPath,
      repoRoot,
      decisionStates,
      new Date()
    ),
  ]);

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const operatorItemsById = new Map(
    operatorItems.map((item) => [item.actionId, item] as const)
  );

  return events
    .filter((event) => event.decision === "done")
    .filter((event) => {
      const decidedAtMs = Date.parse(event.decided_at);
      return Number.isFinite(decidedAtMs) && decidedAtMs >= cutoff;
    })
    .sort((left, right) => {
      return (
        right.decided_at.localeCompare(left.decided_at) ||
        right.event_id.localeCompare(left.event_id)
      );
    })
    .slice(0, 20)
    .map((event) => {
      const operatorItem = operatorItemsById.get(event.action_id);

      return {
        itemKey: event.action_id,
        title: operatorItem?.title ?? event.action_id,
        business: event.business,
        decision: "done" as const,
        actedAt: event.decided_at,
        targetPath: operatorItem?.sourcePath ?? event.source_path,
        itemType: "operator_action" as const,
      };
    });
}

function buildAllDispatchTitleMap(
  queueState: QueueStateRecord,
  sourcePath: string
): Map<string, string> {
  const map = new Map<string, string>();
  const dispatches = Array.isArray(queueState.dispatches) ? queueState.dispatches : [];

  for (const dispatch of dispatches) {
    const dispatchId = readString(dispatch.dispatch_id);
    if (!dispatchId) continue;
    const title =
      readString(dispatch.area_anchor) ??
      readString(dispatch.current_truth) ??
      dispatchId;
    const ideaKey = deriveProcessImprovementsIdeaKey(sourcePath, dispatchId);
    map.set(ideaKey, title);
  }

  return map;
}

async function loadRecentQueueDecisions(
  repoRoot: string,
  allDispatchTitles: Map<string, string>
): Promise<ProcessImprovementsRecentAction[]> {
  const events = await readProcessImprovementsDecisionEvents(repoRoot);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return events
    .filter((event) => event.decision !== "defer")
    .filter((event) => {
      const decidedAtMs = Date.parse(event.decided_at);
      return Number.isFinite(decidedAtMs) && decidedAtMs >= cutoff;
    })
    .sort((left, right) => {
      return (
        right.decided_at.localeCompare(left.decided_at) ||
        right.event_id.localeCompare(left.event_id)
      );
    })
    .slice(0, 20)
    .map((event): ProcessImprovementsRecentAction => ({
      itemKey: event.idea_key,
      title: allDispatchTitles.get(event.idea_key) ?? event.dispatch_id,
      business: event.business,
      decision: event.decision as ProcessImprovementsRecentActionDecision,
      actedAt: event.decided_at,
      itemType: "process_improvement",
      rationale: event.rationale,
    }));
}

async function loadCombinedRecentDecisions(
  repoRoot: string,
  absoluteOperatorActionsPath: string,
  decisionStates: ReadonlyMap<string, ProcessImprovementsOperatorActionDecisionState>,
  allDispatchTitles: Map<string, string>
): Promise<ProcessImprovementsRecentAction[]> {
  const [queueDecisions, operatorCompletions] = await Promise.all([
    loadRecentQueueDecisions(repoRoot, allDispatchTitles),
    loadRecentOperatorActionCompletions(repoRoot, absoluteOperatorActionsPath, decisionStates),
  ]);

  const combined = [...queueDecisions, ...operatorCompletions];

  const sorted = combined.sort((left, right) => {
    return (
      right.actedAt.localeCompare(left.actedAt) ||
      right.itemKey.localeCompare(left.itemKey)
    );
  });

  const seen = new Set<string>();
  const deduplicated = sorted.filter((action) => {
    if (seen.has(action.itemKey)) return false;
    seen.add(action.itemKey);
    return true;
  });

  return deduplicated.slice(0, 20);
}

async function loadCompletedIdeasCount(repoRoot: string): Promise<number> {
  try {
    const absolutePath = path.join(repoRoot, "docs/business-os/_data/completed-ideas.json");
    const raw = (await readFileWithinRoot(repoRoot, absolutePath, "utf-8")) as string;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "entries" in parsed &&
      Array.isArray((parsed as { entries: unknown }).entries)
    ) {
      return (parsed as { entries: unknown[] }).entries.length;
    }
    return 0;
  } catch {
    return 0;
  }
}
