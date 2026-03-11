"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import type {
  ProcessImprovementsActionedItem,
  ProcessImprovementsInboxItem,
} from "@/lib/process-improvements/projection";

/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-102 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

type DecisionAction = "do" | "defer" | "decline";
type SortKey = "date-desc" | "date-asc" | "confidence-desc";

interface ProcessImprovementsInboxProps {
  initialItems: ProcessImprovementsInboxItem[];
  initialActionedItems: ProcessImprovementsActionedItem[];
}

interface PendingState {
  ideaKey: string;
  decision: DecisionAction;
}

const INBOX_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

function isDeferred(item: ProcessImprovementsInboxItem): boolean {
  const deferUntil = item.decisionState?.deferUntil;
  return (
    item.decisionState?.decision === "defer" &&
    typeof deferUntil === "string" &&
    Date.parse(deferUntil) > Date.now()
  );
}

function sortItems(
  items: ProcessImprovementsInboxItem[],
  sortKey: SortKey
): ProcessImprovementsInboxItem[] {
  return [...items].sort((left, right) => {
    if (sortKey === "confidence-desc") {
      const diff = (right.confidence ?? -1) - (left.confidence ?? -1);
      if (diff !== 0) return diff;
    }
    const [a, b] =
      sortKey === "date-asc"
        ? [left.createdAt ?? "", right.createdAt ?? ""]
        : [right.createdAt ?? "", left.createdAt ?? ""];
    return a.localeCompare(b) || left.dispatchId.localeCompare(right.dispatchId);
  });
}

function formatInboxTimestamp(value: string | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return `${INBOX_TIMESTAMP_FORMATTER.format(parsed)} UTC`;
}

const PRIORITY_LABELS: Record<string, string> = {
  P1: "P1 \u2014 Critical",
  P2: "P2 \u2014 High",
  P3: "P3 \u2014 Normal",
};

function formatPriority(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

function decisionButtonLabel(
  pendingState: PendingState | null,
  ideaKey: string,
  decision: DecisionAction
): string {
  if (pendingState?.ideaKey !== ideaKey || pendingState.decision !== decision) {
    return decision === "do"
      ? "Approve"
      : decision === "defer"
        ? "Defer"
        : "Decline";
  }

  return decision === "do"
    ? "Approving\u2026"
    : decision === "defer"
      ? "Deferring\u2026"
      : "Declining\u2026";
}

function statusNotice(item: ProcessImprovementsInboxItem, errorMessage?: string) {
  if (item.decisionState?.decision === "defer" && item.decisionState.deferUntil) {
    return {
      tone: "warning" as const,
      message: `Deferred until ${formatInboxTimestamp(item.decisionState.deferUntil)}.`,
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
  initialActionedItems,
}: ProcessImprovementsInboxProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingState, setPendingState] = useState<PendingState | null>(null);
  const [errorByIdeaKey, setErrorByIdeaKey] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filterBusiness, setFilterBusiness] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");

  const businesses = useMemo(
    () => [...new Set(items.map((i) => i.business).filter(Boolean))].sort(),
    [items]
  );
  const priorities = useMemo(
    () => [...new Set(items.map((i) => i.priority).filter((p): p is string => Boolean(p)))].sort(),
    [items]
  );
  const hasActiveFilters = search !== "" || filterBusiness !== "" || filterPriority !== "";

  const awaitingItems = useMemo(() => {
    let filtered = items.filter((item) => !isDeferred(item));
    if (filterBusiness) filtered = filtered.filter((i) => i.business === filterBusiness);
    if (filterPriority) filtered = filtered.filter((i) => i.priority === filterPriority);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)
      );
    }
    return sortItems(filtered, sortKey);
  }, [items, search, filterBusiness, filterPriority, sortKey]);

  const deferredItems = useMemo(
    () => sortItems(items.filter((item) => isDeferred(item)), sortKey),
    [items, sortKey]
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
    <div className="space-y-8">
      {/* Summary strip */}
      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Awaiting Decision" value={awaitingItems.length} tone="default" />
        <SummaryCard label="Deferred" value={deferredItems.length} tone="warning" />
        <SummaryCard label="Actioned" value={initialActionedItems.length} tone="success" />
      </section>

      {/* Sticky filter toolbar */}
      <FilterToolbar
        search={search}
        setSearch={setSearch}
        filterBusiness={filterBusiness}
        setFilterBusiness={setFilterBusiness}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        sortKey={sortKey}
        setSortKey={setSortKey}
        businesses={businesses}
        priorities={priorities}
        hasActiveFilters={hasActiveFilters}
      />

      <InboxSection
        title="Awaiting decision"
        count={awaitingItems.length}
        emptyCopy="Nothing is waiting for a decision right now."
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
        count={deferredItems.length}
        description="Snoozed for seven days \u2014 reappears automatically when the snooze expires."
        emptyCopy="Nothing is currently snoozed."
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

      {/* Actioned history — server-side, reflects all actors */}
      <ActionedHistory items={initialActionedItems} />
    </div>
  );
}

function FilterToolbar({
  search,
  setSearch,
  filterBusiness,
  setFilterBusiness,
  filterPriority,
  setFilterPriority,
  sortKey,
  setSortKey,
  businesses,
  priorities,
  hasActiveFilters,
}: {
  search: string;
  setSearch: (v: string) => void;
  filterBusiness: string;
  setFilterBusiness: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  businesses: string[];
  priorities: string[];
  hasActiveFilters: boolean;
}) {
  return (
    // eslint-disable-next-line ds/no-nonlayered-zindex, ds/no-negative-margins -- sticky toolbar requires elevation and full-bleed layout; BOS-PI-102 internal page
    <div className="sticky top-0 z-10 -mx-4 border-b border-border-2 bg-bg px-4 py-3 md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Search by title or body"
          placeholder="Search\u2026"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-border-2 bg-panel px-3 py-1.5 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
        {businesses.length > 1 && (
          <select
            aria-label="Filter by business"
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            className="rounded-md border border-border-2 bg-panel px-2 py-1.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">All businesses</option>
            {businesses.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
        {priorities.length > 0 && (
          <select
            aria-label="Filter by priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-md border border-border-2 bg-panel px-2 py-1.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">All priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
        <select
          aria-label="Sort order"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border border-border-2 bg-panel px-2 py-1.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="confidence-desc">Highest confidence</option>
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterBusiness(""); setFilterPriority(""); }}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-secondary underline-offset-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function ActionedHistory({ items }: { items: ProcessImprovementsActionedItem[] }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="text-base font-semibold text-fg">Actioned</h2>
        <span className="rounded-full border border-border-2 bg-inset px-2 py-0.5 text-xs font-medium text-muted">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No decisions have been recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((action) => (
            <li
              key={action.ideaKey}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border-2 bg-panel px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{action.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  <span className={`font-semibold ${action.decision === "do" ? "text-success-fg" : "text-danger-fg"}`}>
                    {action.decision === "do" ? "Approved" : "Declined"}
                  </span>
                  {" \u00b7 "}
                  {action.actorName}
                  {" \u00b7 "}
                  {formatInboxTimestamp(action.decidedAt)}
                </p>
              </div>
              <span className="rounded-full border border-border-2 bg-inset px-2 py-0.5 text-xs font-medium text-secondary">
                {action.business}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
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
  const accentClass =
    tone === "warning"
      ? "bg-warning-fg"
      : tone === "success"
        ? "bg-success-fg"
        : "bg-border";

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-2 bg-panel px-4 py-4">
      <div className={`absolute left-0 top-0 h-0.5 w-full ${accentClass}`} aria-hidden="true" />
      <p className="text-2xl font-bold text-fg">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function InboxSection({
  title,
  count,
  description,
  emptyCopy,
  children,
}: {
  title: string;
  count: number;
  description?: string;
  emptyCopy: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        <span className="rounded-full border border-border-2 bg-inset px-2 py-0.5 text-xs font-medium text-muted">
          {count}
        </span>
        {description && (
          <p className="hidden text-xs text-muted md:block">{description}</p>
        )}
      </div>

      {count === 0 ? (
        <p className="text-sm text-muted">{emptyCopy}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

function priorityAccentClass(priority: string | undefined): string {
  if (priority === "P1") return "bg-danger-fg";
  if (priority === "P2") return "bg-warning-fg";
  return "bg-border";
}

function priorityChipClass(priority: string): string {
  if (priority === "P1") return "bg-danger-soft text-danger-fg";
  if (priority === "P2") return "bg-warning-soft text-warning-fg";
  return "bg-inset text-secondary";
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
  const [expanded, setExpanded] = useState(false);
  const notice = statusNotice(item, errorMessage);

  return (
    <article className="relative flex overflow-hidden rounded-xl border border-border-2 bg-panel transition-shadow duration-150 hover:shadow-sm">
      {/* Priority accent strip */}
      <div
        className={`absolute inset-y-0 left-0 w-[3px] ${priorityAccentClass(item.priority)}`}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-3 py-5 pl-5 pr-4">
        {/* Chips row — appears above the title as context header */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border-2 bg-inset px-2 py-0.5 text-xs font-medium text-secondary">
            {item.business}
          </span>
          {item.priority && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityChipClass(item.priority)}`}>
              {formatPriority(item.priority)}
            </span>
          )}
          {item.confidence !== undefined && (
            <span
              className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-fg"
              title="How confident the system is that this observation is accurate and worth acting on"
            >
              {Math.round(item.confidence * 100)}% confidence
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold leading-snug text-fg">{item.title}</h3>

        {/* Body — expandable */}
        <div>
          <p className={`text-xs leading-relaxed text-secondary ${expanded ? "" : "line-clamp-2"}`}>
            {item.body}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-xs font-medium text-muted underline-offset-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>

        {/* Metadata footer */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>{formatInboxTimestamp(item.createdAt)}</span>
          {item.locationAnchors.length > 0 && (
            <span>
              {item.locationAnchors.length} file
              {item.locationAnchors.length !== 1 ? "s" : ""} affected
            </span>
          )}
        </div>

        {/* Status notice */}
        {notice ? (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              notice.tone === "warning"
                ? "border border-warning-soft bg-warning-soft text-warning-fg"
                : "border border-danger-soft bg-danger-soft text-danger-fg"
            }`}
          >
            {notice.message}
          </p>
        ) : null}
      </div>

      {/* Vertical action column */}
      <div className="flex shrink-0 flex-col gap-1 border-l border-border-2 p-3">
        <ActionButton
          label={decisionButtonLabel(pendingState, item.ideaKey, "do")}
          title="Approve and hand off to the workflow"
          variant="primary"
          disabled={isPending}
          onClick={() => onDecision(item, "do")}
        />
        <ActionButton
          label={decisionButtonLabel(pendingState, item.ideaKey, "defer")}
          title="Snooze for 7 days \u2014 it will reappear automatically"
          variant="secondary"
          disabled={isPending}
          onClick={() => onDecision(item, "defer")}
        />
        <ActionButton
          label={decisionButtonLabel(pendingState, item.ideaKey, "decline")}
          title="Close as rejected \u2014 will not appear again"
          variant="danger"
          disabled={isPending}
          onClick={() => onDecision(item, "decline")}
        />
      </div>
    </article>
  );
}

function ActionButton({
  label,
  title,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  title?: string;
  variant: "primary" | "secondary" | "danger";
  disabled: boolean;
  onClick: () => void;
}) {
  const variantClass =
    variant === "primary"
      ? "bg-accent text-accent-fg hover:bg-accent/90"
      : variant === "danger"
        ? "border border-danger-soft bg-danger-soft text-danger-fg hover:bg-danger-soft/80"
        : "border border-border-2 bg-surface-1 text-secondary hover:bg-inset";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`w-full rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass}`}
    >
      {label}
    </button>
  );
}
