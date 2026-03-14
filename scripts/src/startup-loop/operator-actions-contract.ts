import type { ProcessImprovementsOperatorActionDecisionState } from "./operator-action-decisions-contract.js";

export const OPERATOR_ACTIONS_RELATIVE_PATH =
  "docs/business-os/startup-loop/operator-actions.json";

export type CanonicalOperatorActionKind =
  | "blocker"
  | "stage_gate"
  | "next_step"
  | "decision_waiting";

export interface CanonicalOperatorActionRecord {
  id?: string;
  business?: string;
  kind?: string;
  title?: string;
  summary?: string;
  owner?: string;
  due_at?: string;
  state?: string;
  source_path?: string;
  source_label?: string;
  candidate_id?: string | null;
}

export interface CanonicalOperatorActionsFileRecord {
  items?: CanonicalOperatorActionRecord[];
}

export interface CanonicalOperatorActionItem {
  actionId: string;
  actionKind: CanonicalOperatorActionKind;
  business: string;
  title: string;
  body: string;
  owner?: string;
  dueAt?: string;
  stateLabel: string;
  sourcePath: string;
  sourceLabel?: string;
  isOverdue: boolean;
  candidateId?: string | null;
  decisionState?: ProcessImprovementsOperatorActionDecisionState;
}

const CANONICAL_OPERATOR_ACTION_KINDS = new Set<CanonicalOperatorActionKind>([
  "blocker",
  "stage_gate",
  "next_step",
  "decision_waiting",
]);

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function isCanonicalOperatorActionsFileRecord(
  value: unknown
): value is CanonicalOperatorActionsFileRecord {
  return typeof value === "object" && value !== null;
}

function readCanonicalOperatorActionKind(
  value: unknown
): CanonicalOperatorActionKind | undefined {
  const parsed = readNonEmptyString(value);
  if (
    !parsed ||
    !CANONICAL_OPERATOR_ACTION_KINDS.has(parsed as CanonicalOperatorActionKind)
  ) {
    return undefined;
  }

  return parsed as CanonicalOperatorActionKind;
}

export function normalizeCanonicalOperatorActionStateLabel(
  value: string | undefined
): string {
  if (!value) {
    return "Open";
  }

  const normalized = value.replace(/_/g, " ").trim();
  if (!normalized) {
    return "Open";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function isCanonicalOperatorActionOverdue(
  dueAt: string | undefined,
  stateLabel: string,
  now: Date = new Date()
): boolean {
  if (!dueAt) {
    return false;
  }

  const normalizedState = stateLabel.toLowerCase();
  if (normalizedState === "closed" || normalizedState === "done") {
    return false;
  }

  const parsed = Date.parse(`${dueAt}T23:59:59.999Z`);
  return Number.isFinite(parsed) && parsed < now.getTime();
}

export function projectCanonicalOperatorActionItems(
  operatorActions: CanonicalOperatorActionsFileRecord,
  sourcePath: string,
  decisionStates: ReadonlyMap<
    string,
    ProcessImprovementsOperatorActionDecisionState
  > = new Map(),
  now: Date = new Date()
): CanonicalOperatorActionItem[] {
  const items = Array.isArray(operatorActions.items) ? operatorActions.items : [];

  return items
    .map<CanonicalOperatorActionItem | null>((record) => {
      const actionId = readNonEmptyString(record.id);
      const title = readNonEmptyString(record.title);
      const actionKind = readCanonicalOperatorActionKind(record.kind);
      const actionSourcePath = readNonEmptyString(record.source_path);

      if (!actionId || !title || !actionKind || !actionSourcePath) {
        return null;
      }

      const stateLabel = normalizeCanonicalOperatorActionStateLabel(
        readNonEmptyString(record.state)
      );
      const dueAt = readNonEmptyString(record.due_at);

      return {
        actionId,
        actionKind,
        business: readNonEmptyString(record.business) ?? "BOS",
        title,
        body: readNonEmptyString(record.summary) ?? "No summary available.",
        owner: readNonEmptyString(record.owner),
        dueAt,
        stateLabel,
        sourcePath: actionSourcePath,
        sourceLabel: readNonEmptyString(record.source_label) ?? sourcePath,
        isOverdue: isCanonicalOperatorActionOverdue(dueAt, stateLabel, now),
        candidateId: readNonEmptyString(record.candidate_id) ?? null,
        decisionState: decisionStates.get(actionId),
      };
    })
    .filter((item): item is CanonicalOperatorActionItem => item !== null)
    .sort((left, right) => {
      if (left.isOverdue !== right.isOverdue) {
        return left.isOverdue ? -1 : 1;
      }

      const leftDue = left.dueAt ?? "9999-12-31";
      const rightDue = right.dueAt ?? "9999-12-31";

      return (
        leftDue.localeCompare(rightDue) ||
        left.title.localeCompare(right.title) ||
        left.actionId.localeCompare(right.actionId)
      );
    });
}

export function parseCanonicalOperatorActionItemsFromJson(
  raw: string,
  sourcePath: string = OPERATOR_ACTIONS_RELATIVE_PATH,
  decisionStates: ReadonlyMap<
    string,
    ProcessImprovementsOperatorActionDecisionState
  > = new Map(),
  now: Date = new Date()
): CanonicalOperatorActionItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isCanonicalOperatorActionsFileRecord(parsed)) {
    return [];
  }

  return projectCanonicalOperatorActionItems(parsed, sourcePath, decisionStates, now);
}
