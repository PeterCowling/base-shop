"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  Button,
  Tag,
} from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";
import { cn } from "@acme/design-system/utils/style";

import type {
  ProcessImprovementQueueInboxItem,
  ProcessImprovementsInboxItem,
  ProcessImprovementsOperatorActionItem,
  ProcessImprovementsRecentAction,
  ProcessImprovementsWorkItemAction,
} from "@/lib/process-improvements/projection";

/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-102 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

type QueueDecisionAction = "do" | "defer" | "decline";
type OperatorActionDecision = "done" | "snooze";
type PendingDecision = QueueDecisionAction | OperatorActionDecision;
const ALL_BUSINESSES_FILTER = "all-businesses";
const ALL_TYPES_FILTER = "all-types";
const ALL_PRIORITIES_FILTER = "all-priorities";
const DEFER_PERIOD_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

interface NewIdeasInboxProps {
  initialItems: ProcessImprovementsInboxItem[];
  initialRecentActions: ProcessImprovementsRecentAction[];
  initialInProgressDispatchIds: string[];
  initialInProgressCount: number;
}

interface PendingState {
  targetKey: string;
  decision: PendingDecision;
}

const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatDeterministicDate(value: string): string {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const monthIndex = Number(month) - 1;
    const monthLabel = MONTH_ABBREVIATIONS[monthIndex];

    if (monthLabel) {
      return `${day} ${monthLabel} ${year}`;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getUTCFullYear();
  const monthLabel = MONTH_ABBREVIATIONS[parsed.getUTCMonth()];
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${day} ${monthLabel} ${year}`;
}

function formatPriorityLabel(reason: string): string {
  const map: Record<string, string> = {
    "Queue backlog P1": "High priority",
    "Queue backlog P2": "Standard priority",
    "Queue backlog P3": "Low priority",
    "Deferred queue item": "Deferred",
    "Unprioritized queue backlog": "No priority set",
    "Resolved operator action": "Resolved",
    "Snoozed operator action": "Snoozed",
  };
  // Dynamic patterns: "Active <kind>" → "Active", "Overdue <kind>" → "Overdue"
  if (reason.startsWith("Active ")) return "Active";
  if (reason.startsWith("Overdue ")) return "Overdue";
  return map[reason] ?? reason;
}

function formatDeterministicDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getUTCFullYear();
  const monthLabel = MONTH_ABBREVIATIONS[parsed.getUTCMonth()];
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");

  return `${day} ${monthLabel} ${year} ${hours}:${minutes} UTC`;
}

function isProcessImprovementQueueItem(
  item: ProcessImprovementsInboxItem
): item is ProcessImprovementQueueInboxItem {
  return item.itemType === "process_improvement";
}

function isProcessImprovementsOperatorActionItem(
  item: ProcessImprovementsInboxItem
): item is ProcessImprovementsOperatorActionItem {
  return item.itemType === "operator_action";
}

function isQueueDecisionAction(
  decision: PendingDecision
): decision is QueueDecisionAction {
  return decision === "do" || decision === "defer" || decision === "decline";
}

function isOperatorActionDecision(
  decision: PendingDecision
): decision is OperatorActionDecision {
  return decision === "done" || decision === "snooze";
}

function compareWorkItemsForDisplay(
  left: ProcessImprovementsInboxItem,
  right: ProcessImprovementsInboxItem
): number {
  const statusRank = {
    active: 0,
    deferred: 1,
    resolved: 2,
  } as const;

  if (statusRank[left.statusGroup] !== statusRank[right.statusGroup]) {
    return statusRank[left.statusGroup] - statusRank[right.statusGroup];
  }

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

  const leftCreated = left.createdAt ?? "";
  const rightCreated = right.createdAt ?? "";
  if (leftCreated !== rightCreated) {
    return rightCreated.localeCompare(leftCreated);
  }

  return left.title.localeCompare(right.title) || left.itemKey.localeCompare(right.itemKey);
}

function sortWorkItemsForDisplay(
  items: ProcessImprovementsInboxItem[]
): ProcessImprovementsInboxItem[] {
  return [...items].sort(compareWorkItemsForDisplay);
}

function workItemButtonLabel(
  pendingState: PendingState | null,
  itemKey: string,
  action: ProcessImprovementsWorkItemAction
): string {
  if (
    pendingState?.targetKey !== itemKey ||
    pendingState.decision !== action.decision
  ) {
    return action.label;
  }

  switch (action.decision) {
    case "do":
      return "Doing...";
    case "defer":
      return "Deferring...";
    case "decline":
      return "Declining...";
    case "done":
      return "Marking...";
    case "snooze":
      return "Snoozing...";
    default:
      return action.label;
  }
}

function workItemStatusNotice(
  item: ProcessImprovementsInboxItem,
  errorMessage?: string
) {
  if (
    isProcessImprovementQueueItem(item) &&
    item.decisionState?.decision === "defer" &&
    item.decisionState.deferUntil
  ) {
    return {
      tone: "warning" as const,
      message: `Deferred until ${formatDeterministicDateTime(item.decisionState.deferUntil)}.`,
    };
  }

  if (
    isProcessImprovementQueueItem(item) &&
    item.decisionState?.executionResult === "failed" &&
    item.decisionState.executionError
  ) {
    return {
      tone: "danger" as const,
      message: `Last action failed: ${item.decisionState.executionError}`,
    };
  }

  if (
    isProcessImprovementsOperatorActionItem(item) &&
    item.decisionState?.decision === "snooze" &&
    item.decisionState.snoozeUntil
  ) {
    return {
      tone: "warning" as const,
      message: `Snoozed until ${formatDeterministicDateTime(item.decisionState.snoozeUntil)}.`,
    };
  }

  if (errorMessage) {
    return {
      tone: "danger" as const,
      message: errorMessage,
    };
  }

  return null;
}

function removeItemFromList(
  current: ProcessImprovementsInboxItem[],
  itemKey: string
): ProcessImprovementsInboxItem[] {
  return current.filter((candidate) => candidate.itemKey !== itemKey);
}

function updateItemInList(
  current: ProcessImprovementsInboxItem[],
  itemKey: string,
  updater: (item: ProcessImprovementsInboxItem) => ProcessImprovementsInboxItem
): ProcessImprovementsInboxItem[] {
  return current.map((candidate) =>
    candidate.itemKey === itemKey ? updater(candidate) : candidate
  );
}

function applyDeferredQueueDecision(
  candidate: ProcessImprovementQueueInboxItem,
  deferUntil?: string
): ProcessImprovementQueueInboxItem {
  return {
    ...candidate,
    statusGroup: "deferred",
    stateLabel: "Deferred",
    priorityBand: 80,
    priorityReason: "Deferred queue item",
    decisionState: {
      decision: "defer",
      decidedAt: new Date().toISOString(),
      deferUntil,
    },
  };
}

function applySnoozedOperatorActionDecision(
  candidate: ProcessImprovementsOperatorActionItem,
  snoozeUntil?: string
): ProcessImprovementsOperatorActionItem {
  return {
    ...candidate,
    statusGroup: "deferred",
    stateLabel: "Snoozed",
    priorityBand: 80,
    priorityReason: "Snoozed operator action",
    decisionState: {
      decision: "snooze",
      decidedAt: new Date().toISOString(),
      snoozeUntil,
    },
  };
}

function createRecentQueueAction(
  item: ProcessImprovementQueueInboxItem,
  decision: Exclude<QueueDecisionAction, "defer">,
  targetPath?: string,
  rationale?: string
): ProcessImprovementsRecentAction {
  return {
    itemKey: item.itemKey,
    title: item.title,
    decision,
    actedAt: new Date().toISOString(),
    targetPath,
    business: item.business,
    itemType: "process_improvement",
    rationale,
  };
}

function createRecentOperatorAction(
  item: ProcessImprovementsOperatorActionItem,
  sourcePath?: string
): ProcessImprovementsRecentAction {
  return {
    itemKey: item.itemKey,
    title: item.title,
    decision: "done",
    actedAt: new Date().toISOString(),
    targetPath: sourcePath ?? item.sourcePath,
    business: item.business,
    itemType: "operator_action",
  };
}

function deriveBusinessOptions(
  items: ProcessImprovementsInboxItem[],
  recentActions: ProcessImprovementsRecentAction[]
): string[] {
  return Array.from(
    new Set([
      ...items.map((item) => item.business),
      ...recentActions.map((action) => action.business),
    ])
  ).sort((left, right) => left.localeCompare(right));
}

function filterByBusiness<T extends { business: string }>(
  records: T[],
  business: string
): T[] {
  if (business === ALL_BUSINESSES_FILTER) {
    return records;
  }

  return records.filter((record) => record.business === business);
}

function useProcessImprovementsDerivedItems(items: ProcessImprovementsInboxItem[]) {
  return useMemo(() => {
    const ordered = sortWorkItemsForDisplay(items);
    const activeItems = ordered.filter((item) => item.statusGroup === "active");
    const deferredItems = ordered.filter((item) => item.statusGroup === "deferred");

    return {
      activeItems,
      deferredItems,
      activeQueueCount: activeItems.filter(isProcessImprovementQueueItem).length,
      activeOperatorActionCount: activeItems.filter(
        isProcessImprovementsOperatorActionItem
      ).length,
    };
  }, [items]);
}

function useNewIdeasInboxState(
  initialItems: ProcessImprovementsInboxItem[],
  initialRecentActions: ProcessImprovementsRecentAction[]
) {
  const [items, setItems] = useState(initialItems);
  const [recentActions, setRecentActions] = useState(initialRecentActions);
  const [pendingState, setPendingState] = useState<PendingState | null>(null);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const {
    activeItems,
    deferredItems,
    activeQueueCount,
    activeOperatorActionCount,
  } = useProcessImprovementsDerivedItems(items);
  function setActionError(targetKey: string, error: string | null) {
    setErrorByKey((current) => {
      if (!error) {
        const next = { ...current };
        delete next[targetKey];
        return next;
      }
      return {
        ...current,
        [targetKey]: error,
      };
    });
  }
  function handleQueueDecision(
    item: ProcessImprovementQueueInboxItem,
    decision: QueueDecisionAction,
    deferDays?: number,
    rationale?: string
  ) {
    setPendingState({ targetKey: item.itemKey, decision });
    setActionError(item.itemKey, null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/process-improvements/decision/${decision}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ideaKey: item.ideaKey,
            dispatchId: item.dispatchId,
            ...(decision === "defer" && deferDays ? { deferDays } : {}),
            ...(decision === "decline" && rationale ? { rationale } : {}),
          }),
        });
        const payload = (await response.json()) as {
          error?: string;
          details?: string;
          deferUntil?: string;
          targetPath?: string;
        };
        if (!response.ok) {
          setActionError(
            item.itemKey,
            payload.details ?? payload.error ?? "Decision failed."
          );
          return;
        }

        if (decision === "defer") {
          setItems((current) =>
            updateItemInList(current, item.itemKey, (candidate) =>
              isProcessImprovementQueueItem(candidate)
                ? applyDeferredQueueDecision(candidate, payload.deferUntil)
                : candidate
            )
          );
          return;
        }
        setItems((current) => removeItemFromList(current, item.itemKey));
        setRecentActions((current) => [
          createRecentQueueAction(item, decision, payload.targetPath, rationale),
          ...current.filter((record) => record.itemKey !== item.itemKey),
        ]);
      } catch (error) {
        setActionError(
          item.itemKey,
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setPendingState(null);
      }
    });
  }
  function handleOperatorActionDecision(
    item: ProcessImprovementsOperatorActionItem,
    decision: OperatorActionDecision,
    snoozeDays?: number
  ) {
    setPendingState({ targetKey: item.itemKey, decision });
    setActionError(item.itemKey, null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/process-improvements/operator-actions/${decision}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              actionId: item.actionId,
              ...(decision === "snooze" && snoozeDays ? { snoozeDays } : {}),
            }),
          }
        );
        const payload = (await response.json()) as {
          error?: string;
          details?: string;
          snoozeUntil?: string;
          sourcePath?: string;
        };
        if (!response.ok) {
          setActionError(
            item.itemKey,
            payload.details ?? payload.error ?? "Decision failed."
          );
          return;
        }

        if (decision === "snooze") {
          setItems((current) =>
            updateItemInList(current, item.itemKey, (candidate) =>
              isProcessImprovementsOperatorActionItem(candidate)
                ? applySnoozedOperatorActionDecision(
                    candidate,
                    payload.snoozeUntil
                  )
                : candidate
            )
          );
          return;
        }
        setItems((current) => removeItemFromList(current, item.itemKey));
        setRecentActions((current) => [
          createRecentOperatorAction(item, payload.sourcePath),
          ...current.filter((record) => record.itemKey !== item.itemKey),
        ]);
      } catch (error) {
        setActionError(
          item.itemKey,
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setPendingState(null);
      }
    });
  }
  function handleItemDecision(
    item: ProcessImprovementsInboxItem,
    decision: PendingDecision,
    postponeDays?: number,
    rationale?: string
  ) {
    if (isProcessImprovementQueueItem(item) && isQueueDecisionAction(decision)) {
      handleQueueDecision(item, decision, decision === "defer" ? postponeDays : undefined, rationale);
      return;
    }

    if (
      isProcessImprovementsOperatorActionItem(item) &&
      isOperatorActionDecision(decision)
    ) {
      handleOperatorActionDecision(item, decision, decision === "snooze" ? postponeDays : undefined);
    }
  }

  const refreshFromServer = useCallback(
    (
      nextItems: ProcessImprovementsInboxItem[],
      nextRecentActions: ProcessImprovementsRecentAction[]
    ) => {
      if (pendingState) return;
      setItems(nextItems);
      setRecentActions(nextRecentActions);
    },
    [pendingState]
  );

  return {
    activeItems,
    deferredItems,
    activeQueueCount,
    activeOperatorActionCount,
    recentActions,
    pendingState,
    errorByKey,
    isPending,
    handleItemDecision,
    refreshFromServer,
  };
}

function useBulkSelection(
  activeItems: ProcessImprovementsInboxItem[],
  handleItemDecision: (item: ProcessImprovementsInboxItem, decision: PendingDecision, postponeDays?: number, rationale?: string) => void
) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const toggleSelected = useCallback((itemKey: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);
  const [bulkPending, setBulkPending] = useState(false);
  const handleItemDecisionRef = useRef(handleItemDecision);
  handleItemDecisionRef.current = handleItemDecision;
  const handleBulkDecision = useCallback(
    (decision: QueueDecisionAction, deferDays?: number) => {
      const selectedItems = activeItems.filter(
        (item) => selectedKeys.has(item.itemKey) && isProcessImprovementQueueItem(item)
      ) as ProcessImprovementQueueInboxItem[];
      if (selectedItems.length === 0) return;
      setBulkPending(true);
      for (const item of selectedItems) {
        handleItemDecisionRef.current(item, decision, deferDays);
      }
      setSelectedKeys(new Set());
      setBulkPending(false);
    },
    [activeItems, selectedKeys]
  );
  return { selectedKeys, toggleSelected, clearSelection, bulkPending, handleBulkDecision };
}

const AUTO_REFRESH_INTERVAL_MS = 30_000;

function useAutoRefresh(
  refreshFromServer: (
    items: ProcessImprovementsInboxItem[],
    recentActions: ProcessImprovementsRecentAction[]
  ) => void,
  setInProgressDispatchIds: (ids: Set<string>) => void,
  isPending: boolean
) {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshRef = useRef(refreshFromServer);
  refreshRef.current = refreshFromServer;
  const dispatchIdsRef = useRef(setInProgressDispatchIds);
  dispatchIdsRef.current = setInProgressDispatchIds;

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!mounted || isPending) return;
      setIsRefreshing(true);
      try {
        const response = await fetch("/api/process-improvements/items");
        if (!response.ok || !mounted) return;
        const data = (await response.json()) as {
          items: ProcessImprovementsInboxItem[];
          recentActions: ProcessImprovementsRecentAction[];
          inProgressDispatchIds?: string[];
        };
        if (mounted) {
          refreshRef.current(data.items, data.recentActions);
          if (data.inProgressDispatchIds) {
            dispatchIdsRef.current(new Set(data.inProgressDispatchIds));
          }
          setLastRefreshed(new Date());
        }
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    }

    const id = setInterval(poll, AUTO_REFRESH_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isPending]);

  return { lastRefreshed, isRefreshing };
}

function formatDeterministicTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function RefreshIndicator({
  lastRefreshed,
  isRefreshing,
}: {
  lastRefreshed: Date | null;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-muted">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300",
          isRefreshing ? "bg-info animate-pulse" : "bg-success"
        )}
      />
      {isRefreshing
        ? "Refreshing..."
        : lastRefreshed
        ? `Updated ${formatDeterministicTime(lastRefreshed)}`
        : "Auto-refresh every 30s"}
    </div>
  );
}

function formatOperatorActionKind(
  actionKind: ProcessImprovementsOperatorActionItem["actionKind"]
): string {
  switch (actionKind) {
    case "blocker":
      return "Blocker";
    case "stage_gate":
      return "Stage gate";
    case "next_step":
      return "Next step";
    case "decision_waiting":
      return "Decision";
    default:
      return actionKind;
  }
}

function WorkItemIdentityRow({ item }: { item: ProcessImprovementsInboxItem }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Tag
        size="sm"
        tone="soft"
        color={isProcessImprovementQueueItem(item) ? "accent" : "primary"}
      >
        {isProcessImprovementQueueItem(item) ? "Queue" : "Action"}
      </Tag>
      <span className="font-semibold text-fg">{item.business}</span>
      <span className="text-muted">&middot;</span>
      <span className="text-secondary">{item.stateLabel}</span>

      {isProcessImprovementQueueItem(item) && item.priority ? (
        <Tag size="sm" tone="solid" color={item.priority === "P1" ? "danger" : "warning"}>
          {item.priority}
        </Tag>
      ) : null}
      {isProcessImprovementQueueItem(item) && item.confidence !== undefined ? (
        <span className="text-muted tabular-nums">
          {Math.round(item.confidence * 100)}%
        </span>
      ) : null}
      {isProcessImprovementsOperatorActionItem(item) ? (
        <Tag size="sm" tone="soft" color={item.actionKind === "blocker" ? "warning" : "info"}>
          {formatOperatorActionKind(item.actionKind)}
        </Tag>
      ) : null}

      {item.isOverdue ? (
        <Tag size="sm" tone="solid" color="danger" className="ms-auto">
          {item.dueAt ? `Overdue ${formatDeterministicDate(item.dueAt)}` : "Overdue"}
        </Tag>
      ) : item.statusGroup === "deferred" ? (
        <Tag size="sm" tone="soft" color="warning" className="ms-auto">
          Deferred
        </Tag>
      ) : null}
    </div>
  );
}

function WorkItemPriorityPanel({ item }: { item: ProcessImprovementsInboxItem }) {
  return (
    <div
      className={cn(
        "rounded-lg border-s-2 bg-surface-2 px-3 py-2",
        item.isOverdue
          ? "border-s-danger"
          : item.statusGroup === "deferred"
          ? "border-s-warning"
          : "border-s-info"
      )}
    >
      <p className="text-xs text-muted">Why now</p>
      <p className="mt-0.5 text-sm leading-relaxed text-secondary">
        {formatPriorityLabel(item.priorityReason)}
      </p>
    </div>
  );
}

function WorkItemNotice({
  notice,
}: {
  notice: { tone: "warning" | "danger"; message: string } | null;
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-xs font-medium",
        notice.tone === "warning"
          ? "bg-warning-soft text-warning-fg"
          : "bg-danger-soft text-danger-fg"
      )}
    >
      {notice.message}
    </div>
  );
}

function PostponePickerButton({
  label,
  isOpen,
  onToggle,
  isPending,
  onSelect,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  isPending: boolean;
  onSelect: (days: number) => void;
}) {
  return (
    <div className="relative">
      <Button
        size="sm"
        color="default"
        tone="outline"
        disabled={isPending}
        onClick={onToggle}
        className="min-w-20 transition-transform duration-150 active:scale-95"
      >
        {label} ▾
      </Button>
      {isOpen ? (
        /* eslint-disable-next-line ds/no-nonlayered-zindex -- BOS-PI-103 dropdown needs z-index to overlay adjacent cards */
        <div className="absolute start-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-elevation-3">
          {DEFER_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              className="block min-h-11 w-full whitespace-nowrap px-4 py-2 text-start text-sm text-fg hover:bg-surface-2"
              onClick={() => onSelect(option.days)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  variant: "primary" | "secondary" | "danger";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      size="sm"
      color={
        variant === "primary"
          ? "primary"
          : variant === "danger"
          ? "danger"
          : "default"
      }
      tone={variant === "secondary" ? "outline" : "solid"}
      className="min-w-20 transition-transform duration-150 active:scale-95"
    >
      {label}
    </Button>
  );
}

function DecisionBriefPanel({
  item,
  showEvidence,
  onToggleEvidence,
}: {
  item: ProcessImprovementQueueInboxItem;
  showEvidence: boolean;
  onToggleEvidence: () => void;
}) {
  const brief = item.decisionBrief;
  if (!brief) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-s-2 border-s-warning bg-surface-2 px-3 py-2">
        <p className="text-xs font-medium text-muted">Why this matters now</p>
        <p className="mt-0.5 text-sm leading-relaxed text-secondary">{brief.whyNow}</p>
      </div>

      <div className="rounded-lg bg-success-soft px-3 py-2">
        <p className="text-xs font-medium text-success-fg">Business benefit</p>
        <p className="mt-0.5 text-sm leading-relaxed text-fg">{brief.businessBenefit}</p>
      </div>

      <div className="rounded-lg bg-info-soft px-3 py-2">
        <p className="text-xs font-medium text-info-fg">If you press Do</p>
        <p className="mt-0.5 text-sm leading-relaxed text-fg">{brief.expectedNextStep}</p>
      </div>

      {brief.confidenceExplainer ? (
        <p className="text-xs italic text-muted">{brief.confidenceExplainer}</p>
      ) : null}

      <button
        type="button"
        onClick={onToggleEvidence}
        className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-secondary"
      >
        <svg
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-150",
            showEvidence && "rotate-180"
          )}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
        Evidence & details
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          showEvidence ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 pt-1">
            {brief.evidenceLabels.map((label, index) => (
              <div
                key={`${label.raw}-${index}`}
                className="flex items-start gap-2 text-xs"
              >
                <span className="shrink-0 font-medium text-muted">{label.label}:</span>
                <code className="break-all font-mono text-muted/80">{label.raw}</code>
              </div>
            ))}

            {item.body && item.body !== brief.problem && item.body !== brief.whyNow ? (
              <p className="text-xs leading-relaxed text-muted">
                <span className="font-medium">Detail: </span>
                {item.body}
              </p>
            ) : null}

            <p className="text-xs text-muted">
              <span className="font-medium">Dispatch ID: </span>
              <code className="font-mono">{item.dispatchId}</code>
            </p>

            {item.locationAnchors.length > 0 ? (
              <div className="space-y-1">
                {item.locationAnchors.map((anchor, index) => (
                  <p key={`${anchor}-${index}`} className="text-xs">
                    <code className="break-all font-mono text-muted/80">{anchor}</code>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkItemCard({
  item,
  pendingState,
  errorMessage,
  isPending,
  onDecision,
  isExpanded,
  onToggleExpanded,
  isSelected,
  onToggleSelected,
}: {
  item: ProcessImprovementsInboxItem;
  pendingState: PendingState | null;
  errorMessage?: string;
  isPending: boolean;
  onDecision: (item: ProcessImprovementsInboxItem, decision: PendingDecision, postponeDays?: number, rationale?: string) => void;
  isExpanded: boolean;
  onToggleExpanded: (itemKey: string) => void;
  isSelected?: boolean;
  onToggleSelected?: (itemKey: string) => void;
}) {
  const [showDeferPicker, setShowDeferPicker] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [declineRationale, setDeclineRationale] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const notice = workItemStatusNotice(item, errorMessage);
  const accentBgClass = item.isOverdue
    ? "bg-danger"
    : item.statusGroup === "deferred"
    ? "bg-warning"
    : "bg-primary";

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-surface-1 shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-3",
        item.isOverdue
          ? "border-danger-soft"
          : isSelected
          ? "border-primary"
          : item.statusGroup === "deferred"
          ? "border-border"
          : "border-border-2"
      )}
    >
      <div className={cn("absolute inset-y-0 start-0 w-1 transition-all duration-200 group-hover:w-1.5", accentBgClass)} />

      <div className="flex min-h-14 w-full items-center gap-3 p-4 ps-5 md:px-5 md:ps-6">
        {onToggleSelected ? (
          <input
            type="checkbox"
            checked={isSelected ?? false}
            onChange={() => onToggleSelected(item.itemKey)}
            className="h-5 w-5 min-h-5 min-w-5 shrink-0 rounded border-border accent-primary"
          />
        ) : null}
        <button
          type="button"
          onClick={() => onToggleExpanded(item.itemKey)}
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <WorkItemIdentityRow item={item} />
            <h3 className="truncate text-base font-semibold leading-6 text-fg">{item.title}</h3>
          </div>
          <svg
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className={cn("overflow-hidden", isExpanded && "overflow-visible")}>
          <div className="space-y-3 px-4 pb-4 ps-5 md:px-5 md:pb-5 md:ps-6">
            {isProcessImprovementQueueItem(item) && item.decisionBrief ? (
              <DecisionBriefPanel
                item={item}
                showEvidence={showEvidence}
                onToggleEvidence={() => setShowEvidence((prev) => !prev)}
              />
            ) : (
              <>
                <p className="text-sm leading-relaxed text-secondary">{item.body}</p>
                <WorkItemPriorityPanel item={item} />
              </>
            )}
            <WorkItemNotice notice={notice} />

            {item.availableActions.length > 0 ? (
              <div className="space-y-2 pt-1">
                <Inline gap={2} wrap>
                  {item.availableActions.map((action) =>
                    action.decision === "defer" || action.decision === "snooze" ? (
                      <PostponePickerButton
                        key={action.decision}
                        label={workItemButtonLabel(pendingState, item.itemKey, action)}
                        isOpen={showDeferPicker}
                        onToggle={() => setShowDeferPicker(!showDeferPicker)}
                        isPending={isPending}
                        onSelect={(days) => {
                          onDecision(item, action.decision, days);
                          setShowDeferPicker(false);
                        }}
                      />
                    ) : action.decision === "decline" && isProcessImprovementQueueItem(item) ? (
                      <ActionButton
                        key={action.decision}
                        label={workItemButtonLabel(pendingState, item.itemKey, action)}
                        variant={action.variant}
                        disabled={isPending}
                        onClick={() => setShowDeclineConfirm(true)}
                      />
                    ) : (
                      <ActionButton
                        key={action.decision}
                        label={workItemButtonLabel(pendingState, item.itemKey, action)}
                        variant={action.variant}
                        disabled={isPending}
                        onClick={() => onDecision(item, action.decision)}
                      />
                    )
                  )}
                </Inline>
                {showDeclineConfirm && isProcessImprovementQueueItem(item) ? (
                  <div className="rounded-lg border border-danger-soft bg-danger-soft/30 p-3 space-y-2">
                    <label className="block text-xs font-medium text-danger-fg">
                      Note (optional) — why are you declining this?
                    </label>
                    <textarea
                      value={declineRationale}
                      onChange={(e) => setDeclineRationale(e.target.value)}
                      placeholder="Optional reason..."
                      maxLength={500}
                      rows={2}
                      className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg resize-none focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-danger"
                    />
                    <Inline gap={2}>
                      <Button
                        size="sm"
                        color="danger"
                        tone="solid"
                        disabled={isPending}
                        onClick={() => {
                          onDecision(item, "decline", undefined, declineRationale.trim() || undefined);
                          setShowDeclineConfirm(false);
                          setDeclineRationale("");
                        }}
                      >
                        Confirm decline
                      </Button>
                      <Button
                        size="sm"
                        color="default"
                        tone="outline"
                        disabled={isPending}
                        onClick={() => {
                          setShowDeclineConfirm(false);
                          setDeclineRationale("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Inline>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkActionBar({
  selectedCount,
  isPending,
  onBulkDecision,
  onClearSelection,
}: {
  selectedCount: number;
  isPending: boolean;
  onBulkDecision: (decision: QueueDecisionAction, deferDays?: number) => void;
  onClearSelection: () => void;
}) {
  const [showDeferOptions, setShowDeferOptions] = useState(false);

  if (selectedCount === 0) return null;

  return (
    // eslint-disable-next-line ds/no-nonlayered-zindex -- BOS-PI-103 sticky bar needs z-index to float above cards
    <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl border border-primary bg-primary-soft px-4 py-3 shadow-elevation-2">
      <span className="text-sm font-semibold text-fg">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" color="primary" tone="solid" disabled={isPending} onClick={() => onBulkDecision("do")}>
          Do all
        </Button>
        <PostponePickerButton
          label="Defer all..."
          isOpen={showDeferOptions}
          onToggle={() => setShowDeferOptions(!showDeferOptions)}
          isPending={isPending}
          onSelect={(days) => {
            onBulkDecision("defer", days);
            setShowDeferOptions(false);
          }}
        />
        <Button size="sm" color="danger" tone="solid" disabled={isPending} onClick={() => onBulkDecision("decline")}>
          Decline all
        </Button>
      </div>
      <button
        type="button"
        onClick={onClearSelection}
        className="ms-auto min-h-11 px-2 text-xs font-medium text-secondary hover:text-fg"
      >
        Clear
      </button>
    </div>
  );
}

function RecentlyActionedSection({
  recentActions,
  selectedBusiness,
}: {
  recentActions: ProcessImprovementsRecentAction[];
  selectedBusiness: string;
}) {
  const emptyCopy =
    selectedBusiness === ALL_BUSINESSES_FILTER
      ? "No completed actions yet."
      : `No completed actions yet for ${selectedBusiness}.`;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg">
            Recently actioned
          </h2>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-success-soft px-1.5 text-xs font-semibold tabular-nums text-success-fg">
            {recentActions.length}
          </span>
        </div>
        <p className="text-xs text-muted">Last 7 days</p>
      </div>

      {recentActions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-2 px-5 py-8 text-center text-sm text-muted">
          {emptyCopy}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
          {recentActions.map((action, index) => (
            <div
              key={`${action.itemKey}:${action.decision}:${action.actedAt}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface-2",
                index > 0 && "border-t border-border"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-semibold",
                  action.decision === "done"
                    ? "bg-success-soft text-success-fg"
                    : action.decision === "decline"
                    ? "bg-danger-soft text-danger-fg"
                    : "bg-accent-soft text-fg"
                )}
              >
                {action.decision}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{action.title}</p>
                {action.rationale ? (
                  <p className="mt-0.5 truncate text-xs italic text-muted">{action.rationale}</p>
                ) : null}
                {action.targetPath ? (
                  <code className="mt-0.5 block truncate font-mono text-xs text-muted">
                    {action.targetPath}
                  </code>
                ) : null}
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs font-medium text-secondary">{action.business}</p>
                <p className="text-xs text-muted">{formatDeterministicDateTime(action.actedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryPill({
  label,
  value,
  colorClass,
  emphasis,
}: {
  label: string;
  value: number;
  colorClass: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-shadow duration-200",
        colorClass,
        emphasis && "shadow-elevation-2"
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="font-medium opacity-75">{label}</span>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg shadow-elevation-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProcessImprovementsSummary({
  newIdeasCount,
  inProgressCount,
  activeQueueCount,
  activeOperatorActionCount,
  deferredCount,
  recentActionCount,
  businessOptions,
  selectedBusiness,
  onBusinessChange,
  selectedType,
  onTypeChange,
  selectedPriority,
  onPriorityChange,
}: {
  newIdeasCount: number;
  inProgressCount: number;
  activeQueueCount: number;
  activeOperatorActionCount: number;
  deferredCount: number;
  recentActionCount: number;
  businessOptions: string[];
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <SummaryPill
          label="In progress"
          value={inProgressCount}
          colorClass={inProgressCount > 0 ? "bg-info-soft text-info-fg" : "bg-surface-2 text-secondary"}
          emphasis={inProgressCount > 0}
        />
        <SummaryPill
          label="New ideas"
          value={newIdeasCount}
          colorClass={newIdeasCount > 0 ? "bg-primary-soft text-fg" : "bg-surface-2 text-secondary"}
        />
        <SummaryPill label="Queue" value={activeQueueCount} colorClass="bg-primary-soft text-fg" />
        <SummaryPill label="Actions" value={activeOperatorActionCount} colorClass="bg-success-soft text-fg" />
        <SummaryPill label="Deferred" value={deferredCount} colorClass="bg-warning-soft text-warning-fg" />
        <SummaryPill label="Done" value={recentActionCount} colorClass="bg-success-soft text-success-fg" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Scope"
          value={selectedBusiness}
          onChange={onBusinessChange}
          options={[
            { value: ALL_BUSINESSES_FILTER, label: "All businesses" },
            ...businessOptions.map((b) => ({ value: b, label: b })),
          ]}
        />
        <FilterSelect
          label="Type"
          value={selectedType}
          onChange={onTypeChange}
          options={[
            { value: ALL_TYPES_FILTER, label: "All types" },
            { value: "process_improvement", label: "Queue" },
            { value: "operator_action", label: "Actions" },
          ]}
        />
        <FilterSelect
          label="Priority"
          value={selectedPriority}
          onChange={onPriorityChange}
          options={[
            { value: ALL_PRIORITIES_FILTER, label: "All priorities" },
            { value: "P1", label: "P1" },
            { value: "P2", label: "P2" },
            { value: "P3", label: "P3" },
          ]}
        />
      </div>
    </div>
  );
}

function InboxSection({
  id,
  title,
  description,
  emptyCopy,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  emptyCopy: string;
  children: ReactNode;
}) {
  const childCount = Array.isArray(children) ? children.length : children ? 1 : 0;

  return (
    <section id={id} className="scroll-mt-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg">
            {title}
          </h2>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-xs font-semibold tabular-nums text-fg">
            {childCount}
          </span>
        </div>
        <p className="text-xs text-muted">{description}</p>
      </div>

      {childCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-2 px-5 py-8 text-center text-sm text-muted">
          {emptyCopy}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

export function NewIdeasInbox({
  initialItems,
  initialRecentActions,
  initialInProgressDispatchIds,
  initialInProgressCount,
}: NewIdeasInboxProps) {
  const {
    activeItems,
    deferredItems,
    activeOperatorActionCount,
    recentActions,
    pendingState,
    errorByKey,
    isPending,
    handleItemDecision,
    refreshFromServer,
  } = useNewIdeasInboxState(initialItems, initialRecentActions);
  const [inProgressDispatchIds, setInProgressDispatchIds] = useState(
    () => new Set(initialInProgressDispatchIds)
  );
  const headerQueueIdeasCount = useMemo(
    () =>
      activeItems.filter(
        (item) => isProcessImprovementQueueItem(item) && !inProgressDispatchIds.has(item.dispatchId)
      ).length,
    [activeItems, inProgressDispatchIds]
  );
  const { lastRefreshed, isRefreshing } = useAutoRefresh(
    refreshFromServer,
    setInProgressDispatchIds,
    isPending
  );
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const toggleExpanded = useCallback((itemKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  }, []);
  const { selectedKeys, toggleSelected, clearSelection, bulkPending, handleBulkDecision } =
    useBulkSelection(activeItems, handleItemDecision);
  const [selectedBusiness, setSelectedBusiness] = useState(
    ALL_BUSINESSES_FILTER
  );
  const [selectedType, setSelectedType] = useState(ALL_TYPES_FILTER);
  const [selectedPriority, setSelectedPriority] = useState(ALL_PRIORITIES_FILTER);
  const businessOptions = useMemo(
    () => deriveBusinessOptions(initialItems, initialRecentActions),
    [initialItems, initialRecentActions]
  );
  const filteredActiveItems = useMemo(
    () => {
      let result = filterByBusiness(activeItems, selectedBusiness);
      if (selectedType !== ALL_TYPES_FILTER) {
        result = result.filter((item) => item.itemType === selectedType);
      }
      if (selectedPriority !== ALL_PRIORITIES_FILTER) {
        result = result.filter(
          (item) => isProcessImprovementQueueItem(item) && item.priority === selectedPriority
        );
      }
      return result;
    },
    [activeItems, selectedBusiness, selectedType, selectedPriority]
  );
  // Split active items: "new ideas" = not linked to an in-progress plan
  const newIdeasItems = useMemo(
    () =>
      filteredActiveItems.filter(
        (item) =>
          !isProcessImprovementQueueItem(item) ||
          !inProgressDispatchIds.has(item.dispatchId)
      ),
    [filteredActiveItems, inProgressDispatchIds]
  );
  const filteredDeferredItems = useMemo(
    () => filterByBusiness(deferredItems, selectedBusiness),
    [deferredItems, selectedBusiness]
  );
  const filteredRecentActions = useMemo(
    () => filterByBusiness(recentActions, selectedBusiness),
    [recentActions, selectedBusiness]
  );
  const filteredActiveQueueCount = useMemo(
    () => newIdeasItems.filter(isProcessImprovementQueueItem).length,
    [newIdeasItems]
  );
  const filteredActiveOperatorActionCount = useMemo(
    () => newIdeasItems.filter(isProcessImprovementsOperatorActionItem).length,
    [newIdeasItems]
  );
  const activeEmptyCopy =
    selectedBusiness === ALL_BUSINESSES_FILTER
      ? "No new ideas waiting for a decision."
      : `No new ideas waiting for ${selectedBusiness}.`;
  const deferredEmptyCopy =
    selectedBusiness === ALL_BUSINESSES_FILTER
      ? "Nothing is currently deferred."
      : `Nothing is currently deferred for ${selectedBusiness}.`;

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <a
          href="/process-improvements/in-progress"
          className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3 transition-colors hover:bg-hero-foreground/16"
        >
          <p className="text-2xl font-semibold tabular-nums">{initialInProgressCount}</p>
          <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">In progress</p>
        </a>
        <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{activeOperatorActionCount}</p>
          <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">Actions</p>
        </div>
        <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{headerQueueIdeasCount}</p>
          <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">New ideas</p>
        </div>
        <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{deferredItems.length}</p>
          <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">Deferred</p>
        </div>
        <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{recentActions.length}</p>
          <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">Done</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <ProcessImprovementsSummary
          newIdeasCount={newIdeasItems.length}
          inProgressCount={0}
          activeQueueCount={filteredActiveQueueCount}
          activeOperatorActionCount={filteredActiveOperatorActionCount}
          deferredCount={filteredDeferredItems.length}
          recentActionCount={filteredRecentActions.length}
          businessOptions={businessOptions}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
        />
      </div>

      <RefreshIndicator lastRefreshed={lastRefreshed} isRefreshing={isRefreshing} />

      <BulkActionBar
        selectedCount={selectedKeys.size}
        isPending={bulkPending || isPending}
        onBulkDecision={handleBulkDecision}
        onClearSelection={clearSelection}
      />

      <InboxSection
        id="new-ideas"
        title="New ideas"
        description="Items awaiting an initial decision — not yet being worked on."
        emptyCopy={activeEmptyCopy}
      >
        {newIdeasItems.map((item) => (
          <WorkItemCard
            key={item.itemKey}
            item={item}
            pendingState={pendingState}
            errorMessage={errorByKey[item.itemKey]}
            isPending={isPending}
            onDecision={handleItemDecision}
            isExpanded={expandedKeys.has(item.itemKey)}
            onToggleExpanded={toggleExpanded}
            isSelected={selectedKeys.has(item.itemKey)}
            onToggleSelected={toggleSelected}
          />
        ))}
      </InboxSection>

      <InboxSection
        title="Deferred"
        description="Items temporarily moved out of the active queue."
        emptyCopy={deferredEmptyCopy}
      >
        {filteredDeferredItems.map((item) => (
          <WorkItemCard
            key={item.itemKey}
            item={item}
            pendingState={pendingState}
            errorMessage={errorByKey[item.itemKey]}
            isPending={isPending}
            onDecision={handleItemDecision}
            isExpanded={expandedKeys.has(item.itemKey)}
            onToggleExpanded={toggleExpanded}
          />
        ))}
      </InboxSection>

      <RecentlyActionedSection
        recentActions={filteredRecentActions}
        selectedBusiness={selectedBusiness}
      />
    </div>
  );
}
