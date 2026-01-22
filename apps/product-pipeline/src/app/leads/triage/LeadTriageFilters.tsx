"use client";

import { Cluster, Stack } from "@acme/design-system/primitives";

import type { LeadFilters, LeadTriageStrings } from "./types";

export default function LeadTriageFilters({
  strings,
  draftFilters,
  promotionLimit,
  message,
  loading,
  runningStageP,
  eligibleCount,
  promotionValid,
  onDraftChange,
  onPromotionLimitChange,
  onApply,
  onReset,
  onRunStageP,
  onPromoteTop,
}: {
  strings: LeadTriageStrings;
  draftFilters: LeadFilters;
  promotionLimit: string;
  message: string | null;
  loading: boolean;
  runningStageP: boolean;
  eligibleCount: number;
  promotionValid: boolean;
  onDraftChange: (next: LeadFilters) => void;
  onPromotionLimitChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onRunStageP: () => void;
  onPromoteTop: () => void;
}) {
  const disabled = loading;
  const actionDisabled = runningStageP || eligibleCount === 0;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.filters.title}
        </h2>
      </Stack>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.source}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={draftFilters.source}
            onChange={(event) =>
              onDraftChange({ ...draftFilters, source: event.target.value })
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.sourceContext}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={draftFilters.sourceContext}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                sourceContext: event.target.value,
              })
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.search}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={draftFilters.search}
            onChange={(event) =>
              onDraftChange({ ...draftFilters, search: event.target.value })
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.status}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={draftFilters.status}
            onChange={(event) =>
              onDraftChange({ ...draftFilters, status: event.target.value })
            }
            disabled={disabled}
          >
            <option value="">{strings.options.all}</option>
            <option value="NEW">{strings.options.statusNew}</option>
            <option value="ON_HOLD">{strings.options.statusHold}</option>
            <option value="PROMOTED">{strings.options.statusPromoted}</option>
            <option value="REJECTED">{strings.options.statusRejected}</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.triageBand}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={draftFilters.triageBand}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                triageBand: event.target.value,
              })
            }
            disabled={disabled}
          >
            <option value="">{strings.options.all}</option>
            <option value="high">{strings.options.triageHigh}</option>
            <option value="medium">{strings.options.triageMedium}</option>
            <option value="low">{strings.options.triageLow}</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.actions.promoteCount}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={promotionLimit}
            onChange={(event) => onPromotionLimitChange(event.target.value)}
            disabled={disabled}
            type="number"
            min={1}
          />
        </label>
      </div>
      <Cluster justify="between" alignY="center" className="mt-4 gap-3">
        <span className="text-xs text-foreground/60">
          {message ?? strings.notAvailable}
        </span>
        <Cluster gap={2} alignY="center">
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm"
            type="button"
            onClick={onApply}
            disabled={disabled}
          >
            {strings.filters.apply}
          </button>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm"
            type="button"
            onClick={onReset}
            disabled={disabled}
          >
            {strings.filters.reset}
          </button>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onRunStageP}
            disabled={actionDisabled}
          >
            {strings.actions.runStageP}
          </button>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onPromoteTop}
            disabled={actionDisabled || !promotionValid}
          >
            {strings.actions.promoteTop}
          </button>
        </Cluster>
      </Cluster>
    </section>
  );
}
