"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import type { ProcessImprovementsInboxItem } from "@/lib/process-improvements/projection";

/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-102 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

type DecisionAction = "do" | "defer" | "decline";

interface ProcessImprovementsInboxProps {
  initialItems: ProcessImprovementsInboxItem[];
}

interface RecentActionRecord {
  ideaKey: string;
  dispatchId: string;
  title: string;
  decision: Exclude<DecisionAction, "defer">;
  actedAt: string;
  targetPath?: string;
}

interface PendingState {
  ideaKey: string;
  decision: DecisionAction;
}

function isDeferred(item: ProcessImprovementsInboxItem): boolean {
  const deferUntil = item.decisionState?.deferUntil;
  return (
    item.decisionState?.decision === "defer" &&
    typeof deferUntil === "string" &&
    Date.parse(deferUntil) > Date.now()
  );
}

function sortByCreatedAt(items: ProcessImprovementsInboxItem[]): ProcessImprovementsInboxItem[] {
  return [...items].sort((left, right) => {
    const rightCreated = right.createdAt ?? "";
    const leftCreated = left.createdAt ?? "";
    return (
      rightCreated.localeCompare(leftCreated) ||
      left.dispatchId.localeCompare(right.dispatchId)
    );
  });
}

function decisionButtonLabel(
  pendingState: PendingState | null,
  ideaKey: string,
  decision: DecisionAction
): string {
  if (pendingState?.ideaKey !== ideaKey || pendingState.decision !== decision) {
    return decision === "do"
      ? "Do"
      : decision === "defer"
        ? "Defer"
        : "Decline";
  }

  return decision === "do"
    ? "Doing..."
    : decision === "defer"
      ? "Deferring..."
      : "Declining...";
}

function statusNotice(item: ProcessImprovementsInboxItem, errorMessage?: string) {
  if (item.decisionState?.decision === "defer" && item.decisionState.deferUntil) {
    return {
      tone: "warning" as const,
      message: `Deferred until ${new Date(item.decisionState.deferUntil).toLocaleString()}.`,
    };
  }

  if (item.decisionState?.executionResult === "failed" && item.decisionState.executionError) {
    return {
      tone: "danger" as const,
      message: `Last action failed: ${item.decisionState.executionError}`,
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

export function ProcessImprovementsInbox({
  initialItems,
}: ProcessImprovementsInboxProps) {
  const [items, setItems] = useState(initialItems);
  const [recentActions, setRecentActions] = useState<RecentActionRecord[]>([]);
  const [pendingState, setPendingState] = useState<PendingState | null>(null);
  const [errorByIdeaKey, setErrorByIdeaKey] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const awaitingItems = useMemo(
    () =>
      sortByCreatedAt(
        items.filter((item) => !isDeferred(item))
      ),
    [items]
  );

  const deferredItems = useMemo(
    () =>
      sortByCreatedAt(items.filter((item) => isDeferred(item))),
    [items]
  );

  function setIdeaError(ideaKey: string, error: string | null) {
    setErrorByIdeaKey((current) => {
      if (!error) {
        const next = { ...current };
        delete next[ideaKey];
        return next;
      }

      return {
        ...current,
        [ideaKey]: error,
      };
    });
  }

  function handleDecision(item: ProcessImprovementsInboxItem, decision: DecisionAction) {
    setPendingState({ ideaKey: item.ideaKey, decision });
    setIdeaError(item.ideaKey, null);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/process-improvements/decision/${decision}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ideaKey: item.ideaKey,
              dispatchId: item.dispatchId,
            }),
          }
        );

        const payload = (await response.json()) as {
          error?: string;
          details?: string;
          deferUntil?: string;
          targetPath?: string;
        };

        if (!response.ok) {
          setIdeaError(
            item.ideaKey,
            payload.details ?? payload.error ?? "Decision failed."
          );
          return;
        }

        if (decision === "defer") {
          setItems((current) =>
            current.map((candidate) =>
              candidate.ideaKey === item.ideaKey
                ? {
                    ...candidate,
                    decisionState: {
                      decision: "defer",
                      decidedAt: new Date().toISOString(),
                      deferUntil: payload.deferUntil,
                    },
                  }
                : candidate
            )
          );
          return;
        }

        setItems((current) =>
          current.filter((candidate) => candidate.ideaKey !== item.ideaKey)
        );
        setRecentActions((current) => [
          {
            ideaKey: item.ideaKey,
            dispatchId: item.dispatchId,
            title: item.title,
            decision,
            actedAt: new Date().toISOString(),
            targetPath: payload.targetPath,
          },
          ...current,
        ]);
      } catch (error) {
        setIdeaError(
          item.ideaKey,
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setPendingState(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Awaiting Decision"
          value={awaitingItems.length}
          tone="default"
        />
        <SummaryCard
          label="Deferred"
          value={deferredItems.length}
          tone="warning"
        />
        <SummaryCard
          label="Recently Actioned"
          value={recentActions.length}
          tone="success"
        />
      </section>

      <InboxSection
        title="Awaiting decision"
        description="Queue-backed ideas that still need a human call."
        emptyCopy="No queue-backed ideas are currently waiting for a decision."
      >
        {awaitingItems.map((item) => (
          <IdeaCard
            key={item.ideaKey}
            item={item}
            pendingState={pendingState}
            errorMessage={errorByIdeaKey[item.ideaKey]}
            isPending={isPending}
            onDecision={handleDecision}
          />
        ))}
      </InboxSection>

      <InboxSection
        title="Deferred"
        description="Snoozed for seven days without changing queue workflow state."
        emptyCopy="Nothing is currently deferred."
      >
        {deferredItems.map((item) => (
          <IdeaCard
            key={item.ideaKey}
            item={item}
            pendingState={pendingState}
            errorMessage={errorByIdeaKey[item.ideaKey]}
            isPending={isPending}
            onDecision={handleDecision}
          />
        ))}
      </InboxSection>

      <section className="rounded-xl border border-border bg-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-fg">Recently actioned</h2>
            <p className="mt-1 text-sm text-muted">
              Immediate session history for successful `Do` and `Decline` actions.
            </p>
          </div>
        </div>

        {recentActions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Successful actions will appear here as you work through the inbox.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentActions.map((action) => (
              <li
                key={`${action.ideaKey}:${action.decision}:${action.actedAt}`}
                className="rounded-lg border border-border-2 bg-surface-1 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-fg">{action.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                      {action.decision} at {new Date(action.actedAt).toLocaleString()}
                    </p>
                  </div>
                  {action.targetPath ? (
                    <code className="rounded bg-panel px-2 py-1 text-xs text-secondary">
                      {action.targetPath}
                    </code>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "success";
}) {
  const toneClasses =
    tone === "warning"
      ? "border-warning-soft bg-warning-soft text-warning-fg"
      : tone === "success"
        ? "border-success-soft bg-success-soft text-success-fg"
        : "border-border bg-panel text-fg";

  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function InboxSection({
  title,
  description,
  emptyCopy,
  children,
}: {
  title: string;
  description: string;
  emptyCopy: string;
  children: ReactNode;
}) {
  const childCount = Array.isArray(children) ? children.length : children ? 1 : 0;

  return (
    <section className="rounded-xl border border-border bg-panel p-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {childCount === 0 ? (
        <p className="mt-4 text-sm text-muted">{emptyCopy}</p>
      ) : (
        <div className="mt-4 space-y-4">{children}</div>
      )}
    </section>
  );
}

function IdeaCard({
  item,
  pendingState,
  errorMessage,
  isPending,
  onDecision,
}: {
  item: ProcessImprovementsInboxItem;
  pendingState: PendingState | null;
  errorMessage?: string;
  isPending: boolean;
  onDecision: (item: ProcessImprovementsInboxItem, decision: DecisionAction) => void;
}) {
  const notice = statusNotice(item, errorMessage);

  return (
    <article className="rounded-xl border border-border-2 bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-fg">{item.title}</h3>
            {item.priority ? (
              <span className="rounded-full bg-panel px-2 py-1 text-xs font-medium text-secondary">
                {item.priority}
              </span>
            ) : null}
            {item.confidence !== undefined ? (
              <span className="rounded-full bg-panel px-2 py-1 text-xs font-medium text-secondary">
                {Math.round(item.confidence * 100)}% confidence
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-secondary">{item.body}</p>
          <dl className="grid gap-2 text-xs text-muted md:grid-cols-3">
            <div>
              <dt className="font-medium uppercase tracking-wide">Business</dt>
              <dd className="mt-1 text-secondary">{item.business}</dd>
            </div>
            <div>
              <dt className="font-medium uppercase tracking-wide">Dispatch</dt>
              <dd className="mt-1 text-secondary">{item.dispatchId}</dd>
            </div>
            <div>
              <dt className="font-medium uppercase tracking-wide">Created</dt>
              <dd className="mt-1 text-secondary">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}
              </dd>
            </div>
          </dl>
          {item.locationAnchors.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted">
              {item.locationAnchors.slice(0, 3).map((anchor) => (
                <li key={anchor}>
                  <code className="rounded bg-panel px-2 py-1 text-secondary">
                    {anchor}
                  </code>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionButton
            label={decisionButtonLabel(pendingState, item.ideaKey, "do")}
            variant="primary"
            disabled={isPending}
            onClick={() => onDecision(item, "do")}
          />
          <ActionButton
            label={decisionButtonLabel(pendingState, item.ideaKey, "defer")}
            variant="secondary"
            disabled={isPending}
            onClick={() => onDecision(item, "defer")}
          />
          <ActionButton
            label={decisionButtonLabel(pendingState, item.ideaKey, "decline")}
            variant="danger"
            disabled={isPending}
            onClick={() => onDecision(item, "decline")}
          />
        </div>
      </div>

      {notice ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            notice.tone === "warning"
              ? "border border-warning-soft bg-warning-soft text-warning-fg"
              : "border border-danger-soft bg-danger-soft text-danger-fg"
          }`}
        >
          {notice.message}
        </p>
      ) : null}
    </article>
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
  const className =
    variant === "primary"
      ? "bg-accent text-accent-fg hover:bg-accent/90"
      : variant === "danger"
        ? "bg-danger text-danger-fg hover:bg-danger/90"
        : "border border-border-2 bg-panel text-secondary hover:bg-panel/80";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}
