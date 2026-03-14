"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  Tag,
} from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { cn } from "@acme/design-system/utils/style";

import type { ActivePlanProgress } from "@/lib/process-improvements/active-plans";
import type { ProcessImprovementsInboxItem } from "@/lib/process-improvements/projection";

/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-102 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

const ALL_BUSINESSES_FILTER = "all-businesses";
const AUTO_REFRESH_INTERVAL_MS = 30_000;
const SNOOZE_STORAGE_KEY = "bos:plan-snooze:v1";

// --- Snooze helpers ---

function readSnoozeMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function snoozePlan(slug: string, days: number): void {
  try {
    const existing = readSnoozeMap();
    const expiryMs = Date.now() + days * 24 * 60 * 60 * 1000;
    const updated = { ...existing, [slug]: new Date(expiryMs).toISOString() };
    window.localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently degrade
  }
}

function isSnoozed(slug: string, snoozeMap: Record<string, string>): boolean {
  const expiry = snoozeMap[slug];
  if (!expiry) return false;
  const expiryMs = Date.parse(expiry);
  if (!Number.isFinite(expiryMs)) return false;
  return Date.now() < expiryMs;
}

interface InProgressInboxProps {
  initialActivePlans: ActivePlanProgress[];
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

function formatRelativeActivityTime(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return formatDeterministicDateTime(value);
  }

  const diffMs = Math.max(0, Date.now() - parsed);
  if (diffMs < 60_000) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return formatDeterministicDateTime(value);
}

function getPathLeaf(value: string): string {
  const segments = value.split("/");
  return segments[segments.length - 1] ?? value;
}

function ActivePlanHeaderBadges({
  plan,
  pendingExecutionSummary,
}: {
  plan: ActivePlanProgress;
  pendingExecutionSummary: string;
}) {
  return (
    <Stack gap={1} className="shrink-0 items-end">
      {plan.isActiveNow ? (
        <span className="inline-flex h-5 items-center rounded-full bg-info-soft px-2 text-xs font-semibold text-info-fg">
          Active now
        </span>
      ) : null}
      {plan.hasPendingExecution ? (
        <span className="inline-flex h-5 items-center rounded-full bg-warning-soft px-2 text-xs font-semibold text-warning-fg">
          {pendingExecutionSummary}
        </span>
      ) : null}
      {plan.lastUpdated ? (
        <span className="text-xs text-muted">
          {plan.lastUpdated.split(" ")[0] ?? plan.lastUpdated}
        </span>
      ) : null}
    </Stack>
  );
}

function ActivePlanActivitySummary({
  plan,
  activitySummary,
  observationSummary,
  pendingExecutionSummary,
}: {
  plan: ActivePlanProgress;
  activitySummary: string;
  observationSummary: string | null;
  pendingExecutionSummary: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            plan.isActiveNow ? "bg-info animate-pulse" : "bg-surface-3"
          )}
        />
        <span>{activitySummary}</span>
        <span className="text-border-strong">&middot;</span>
        <span title={plan.lastModifiedPath}>{getPathLeaf(plan.lastModifiedPath)}</span>
      </div>

      {plan.hasPendingExecution ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-warning-fg">
          <span className="inline-block h-2 w-2 rounded-full bg-warning animate-pulse" />
          <span>{pendingExecutionSummary}</span>
        </div>
      ) : null}

      {plan.isObservedNow && observationSummary ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-success-fg">
          <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>{observationSummary}</span>
        </div>
      ) : null}
    </>
  );
}

// eslint-disable-next-line complexity -- BOS-PI-103 plan card has rich conditional display; refactor deferred
export function ActivePlanCard({
  plan,
  onSnooze,
}: {
  plan: ActivePlanProgress;
  onSnooze?: (slug: string, days: number) => void;
}) {
  const progress = plan.tasksTotal > 0 ? plan.tasksComplete / plan.tasksTotal : 0;
  const progressPercent = Math.round(progress * 100);
  const hasBlocked = plan.tasksBlocked > 0;
  const activitySummary = plan.isActiveNow
    ? `Touched ${formatRelativeActivityTime(plan.lastModifiedAt)}`
    : `Last touched ${formatRelativeActivityTime(plan.lastModifiedAt)}`;
  const pendingExecutionSummary =
    plan.pendingExecutionCount === 1
      ? "1 handoff in flight"
      : `${plan.pendingExecutionCount} handoffs in flight`;
  const observationSummary =
    plan.lastObservedAt && plan.isObservedNow
      ? `Agent observed ${formatRelativeActivityTime(plan.lastObservedAt)} via ${plan.lastObservedSkillId ?? "agent session"}`
      : null;

  return (
    <div
      className={cn(
        "group rounded-2xl glass-card transition-all duration-200 hover:scale-[1.005]",
        plan.isActiveNow ? "glow-info" : hasBlocked ? "glow-warning" : ""
      )}
    >
      <div className="flex gap-4 p-4">
        {/* Progress ring */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="relative flex h-12 w-12 items-center justify-center">
            {plan.isActiveNow ? (
              <>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-info/30 animate-ping"
                />
                <span className="absolute -right-0.5 top-1 flex h-2.5 w-2.5 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-info animate-ping" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-info" />
                </span>
              </>
            ) : null}
            {plan.hasPendingExecution ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
              >
                <span
                  className="relative block h-full w-full animate-spin"
                  style={{ animationDuration: "3.2s" }}
                >
                  <span className="absolute start-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full border border-warning bg-warning-soft" />
                </span>
              </span>
            ) : null}
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
                className="stroke-surface-3" />
              <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 125.6} 125.6`}
                className={cn(
                  "transition-all duration-700",
                  plan.isActiveNow && "animate-pulse",
                  hasBlocked ? "stroke-warning" : progressPercent === 100 ? "stroke-success" : "stroke-primary"
                )}
              />
            </svg>
            <span className="absolute text-xs font-bold tabular-nums text-fg">
              {progressPercent}%
            </span>
          </div>
          <span className="text-xs tabular-nums text-muted">
            {plan.tasksComplete}/{plan.tasksTotal}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-fg">{plan.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                <Tag size="sm" tone="soft" color="default">{plan.business}</Tag>
                {plan.domain ? (
                  <span className="text-muted">{plan.domain}</span>
                ) : null}
                <span className="text-border-strong">&middot;</span>
                <span className="text-muted">{plan.executionTrack}</span>
                {plan.overallConfidence !== "—" ? (
                  <>
                    <span className="text-border-strong">&middot;</span>
                    <span className="tabular-nums text-muted">{plan.overallConfidence}</span>
                  </>
                ) : null}
              </div>
            </div>
            <ActivePlanHeaderBadges
              plan={plan}
              pendingExecutionSummary={pendingExecutionSummary}
            />
          </div>

          {/* Summary */}
          {plan.summary ? (
            <p className="text-xs leading-relaxed text-secondary">{plan.summary}</p>
          ) : null}

          {/* Current activity or blockers */}
          {hasBlocked ? (
            <div className="space-y-1">
              {plan.blockedTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2 rounded-lg bg-warning-soft px-2.5 py-1.5">
                  <span className="mt-px shrink-0 text-xs font-bold text-warning-fg">{task.id}</span>
                  <div className="min-w-0 text-xs">
                    <span className="text-warning-fg">{task.description}</span>
                    {task.blockedReason ? (
                      <span className="mt-0.5 block font-medium text-warning-fg">
                        {task.blockedReason}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : plan.currentTask ? (
            <div className="flex items-start gap-2 rounded-lg bg-info-soft px-2.5 py-1.5">
              <span className="mt-px shrink-0 text-xs font-bold text-info-fg">{plan.currentTask.id}</span>
              <span className="text-xs text-info-fg">{plan.currentTask.description}</span>
              <Tag size="sm" tone="soft" color="info" className="ms-auto shrink-0">
                {plan.currentTask.type}
              </Tag>
            </div>
          ) : null}

            <ActivePlanActivitySummary
              plan={plan}
              activitySummary={activitySummary}
              observationSummary={observationSummary}
              pendingExecutionSummary={pendingExecutionSummary}
            />

          {/* Artifact trail */}
          {plan.relatedArtifacts.length > 0 ? (
            <Inline gap={1} wrap>
              {plan.relatedArtifacts.map((artifact) => (
                <span
                  key={artifact}
                  className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted"
                >
                  {artifact}
                </span>
              ))}
            </Inline>
          ) : null}

          {/* Snooze actions */}
          {onSnooze ? (
            <Inline gap={2}>
              <Button
                size="sm"
                color="default"
                tone="outline"
                onClick={() => onSnooze(plan.slug, 3)}
              >
                Snooze for 3 days
              </Button>
              <Button
                size="sm"
                color="default"
                tone="outline"
                onClick={() => onSnooze(plan.slug, 7)}
              >
                Snooze for 7 days
              </Button>
            </Inline>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  label,
  count,
  subtitle,
  accentClass,
  countClass,
}: {
  id: string;
  label: string;
  count: number;
  subtitle?: string;
  accentClass?: string;
  countClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <div className="flex items-center gap-2">
        <h2
          id={id}
          className={cn(
            "text-sm font-semibold uppercase tracking-wider",
            accentClass ?? "text-fg"
          )}
        >
          {label}
        </h2>
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
            countClass ?? "bg-info-soft text-info-fg"
          )}
        >
          {count}
        </span>
      </div>
      {subtitle ? (
        <p className="text-xs text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

function RunningNowSection({
  plans,
  onSnooze,
}: {
  plans: ActivePlanProgress[];
  onSnooze: (slug: string, days: number) => void;
}) {
  if (plans.length === 0) return null;

  return (
    <section aria-labelledby="section-running-now" className="scroll-mt-4 space-y-3">
      <SectionHeading
        id="section-running-now"
        label="Running now"
        count={plans.length}
        subtitle="Agent activity detected in the last 10 minutes"
        accentClass="text-info"
        countClass="bg-info-soft text-info-fg"
      />
      <div className="space-y-2">
        {plans.map((plan) => (
          <ActivePlanCard key={plan.slug} plan={plan} onSnooze={onSnooze} />
        ))}
      </div>
    </section>
  );
}

function BlockedSection({
  plans,
  onSnooze,
}: {
  plans: ActivePlanProgress[];
  onSnooze: (slug: string, days: number) => void;
}) {
  if (plans.length === 0) return null;

  return (
    <section aria-labelledby="section-blocked" className="scroll-mt-4 space-y-3">
      <SectionHeading
        id="section-blocked"
        label="Blocked"
        count={plans.length}
        subtitle="Plans with one or more blocked tasks"
        accentClass="text-warning-fg"
        countClass="bg-warning-soft text-warning-fg"
      />
      <div className="space-y-2">
        {plans.map((plan) => (
          <ActivePlanCard key={plan.slug} plan={plan} onSnooze={onSnooze} />
        ))}
      </div>
    </section>
  );
}

function QueuedSection({
  plans,
  onSnooze,
  totalActivePlansCount,
}: {
  plans: ActivePlanProgress[];
  onSnooze: (slug: string, days: number) => void;
  totalActivePlansCount: number;
}) {
  return (
    <section aria-labelledby="section-in-progress" className="scroll-mt-4 space-y-3">
      <SectionHeading
        id="section-in-progress"
        label="In progress"
        count={plans.length}
        subtitle={totalActivePlansCount === 0 ? "Active plans across all sources" : undefined}
        countClass="bg-info-soft text-info-fg"
      />
      {plans.length === 0 ? (
        <p className="text-sm text-muted">No plans currently in progress</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <ActivePlanCard key={plan.slug} plan={plan} onSnooze={onSnooze} />
          ))}
        </div>
      )}
    </section>
  );
}

function useInProgressAutoRefresh(
  setActivePlans: (plans: ActivePlanProgress[]) => void,
  isPending: boolean
) {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const setActivePlansRef = useRef(setActivePlans);
  setActivePlansRef.current = setActivePlans;

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!mounted || isPending) return;
      setIsRefreshing(true);
      try {
        const response = await fetch("/api/process-improvements/items");
        if (!response.ok || !mounted) return;
        const data = (await response.json()) as {
          activePlans: ActivePlanProgress[];
        };
        if (mounted) {
          setActivePlansRef.current(data.activePlans);
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

export function InProgressCountBadge({
  initialActivePlans,
}: {
  initialActivePlans: ActivePlanProgress[];
}) {
  const [count, setCount] = useState(
    initialActivePlans.filter(
      (p) => p.tasksTotal === 0 || p.tasksComplete < p.tasksTotal
    ).length
  );

  useEffect(() => {
    const snoozeMap = readSnoozeMap();
    setCount(
      initialActivePlans
        .filter((p) => p.tasksTotal === 0 || p.tasksComplete < p.tasksTotal)
        .filter((p) => !isSnoozed(p.slug, snoozeMap)).length
    );
  }, [initialActivePlans]);

  return <>{count}</>;
}

export function LiveNewIdeasCount({
  initialItems,
  initialInProgressDispatchIds,
}: {
  initialItems: ProcessImprovementsInboxItem[];
  initialInProgressDispatchIds: string[];
}) {
  const inProgressSet = new Set(initialInProgressDispatchIds);
  const [count, setCount] = useState(
    initialItems
      .filter((item) => item.statusGroup === "active")
      .filter(
        (item) =>
          item.itemType !== "process_improvement" || !inProgressSet.has(item.dispatchId)
      ).length
  );

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!mounted) return;
      try {
        const response = await fetch("/api/process-improvements/items");
        if (!response.ok || !mounted) return;
        const data = (await response.json()) as {
          items: ProcessImprovementsInboxItem[];
          inProgressDispatchIds: string[];
        };
        if (mounted) {
          const ids = new Set(data.inProgressDispatchIds);
          const newCount = data.items
            .filter((item) => item.statusGroup === "active")
            .filter(
              (item) =>
                item.itemType !== "process_improvement" || !ids.has(item.dispatchId)
            ).length;
          setCount(newCount);
        }
      } catch {
        // silently keep last known count on error
      }
    }

    const id = setInterval(poll, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return <>{count}</>;
}

export function InProgressInbox({ initialActivePlans }: InProgressInboxProps) {
  const [activePlans, setActivePlans] = useState(initialActivePlans);
  const [selectedBusiness, setSelectedBusiness] = useState(ALL_BUSINESSES_FILTER);
  const [snoozeMap, setSnoozeMap] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  void setSelectedBusiness;

  useEffect(() => {
    setSnoozeMap(readSnoozeMap());
    setIsMounted(true);
  }, []);

  const handleSnooze = (slug: string, days: number) => {
    snoozePlan(slug, days);
    setSnoozeMap(readSnoozeMap());
  };

  const filteredActivePlans = useMemo(
    () =>
      (selectedBusiness === ALL_BUSINESSES_FILTER
        ? activePlans
        : activePlans.filter((p) => p.business === selectedBusiness)
      )
        .filter((p) => p.tasksTotal === 0 || p.tasksComplete < p.tasksTotal)
        .filter((p) => !isSnoozed(p.slug, snoozeMap)),
    [activePlans, selectedBusiness, snoozeMap]
  );

  const runningNowPlans = useMemo(
    () => filteredActivePlans.filter((p) => p.isActiveNow),
    [filteredActivePlans]
  );

  const blockedPlans = useMemo(
    () => filteredActivePlans.filter((p) => !p.isActiveNow && p.tasksBlocked > 0),
    [filteredActivePlans]
  );

  const queuedPlans = useMemo(
    () => filteredActivePlans.filter((p) => !p.isActiveNow && p.tasksBlocked === 0),
    [filteredActivePlans]
  );

  useInProgressAutoRefresh(setActivePlans, false);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <RunningNowSection plans={runningNowPlans} onSnooze={handleSnooze} />
      <BlockedSection plans={blockedPlans} onSnooze={handleSnooze} />
      <QueuedSection
        plans={queuedPlans}
        onSnooze={handleSnooze}
        totalActivePlansCount={filteredActivePlans.length}
      />
    </div>
  );
}
