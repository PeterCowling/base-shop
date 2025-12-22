"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type { LaneDetailStrings, LaneVersion } from "./types";

const DEFAULT_FORM = {
  laneVersionId: "",
  actualCostAmount: "",
  actualLeadTimeDays: "",
  source: "",
  notes: "",
  promoteConfidence: false,
};

function parseNumber(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseIntValue(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export default function LaneActualsCreateCard({
  versions,
  loading,
  strings,
  onCreated,
}: {
  versions: LaneVersion[];
  loading: boolean;
  strings: LaneDetailStrings;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.laneVersionId) {
        setMessage(strings.messages.createActualsError);
        return;
      }

      const actualCostAmount = parseNumber(form.actualCostAmount);
      const actualLeadTimeDays = parseIntValue(form.actualLeadTimeDays);

      if (actualCostAmount === null || actualLeadTimeDays === null) {
        setMessage(strings.messages.createActualsError);
        return;
      }

      if (actualCostAmount === undefined && actualLeadTimeDays === undefined) {
        setMessage(strings.messages.createActualsError);
        return;
      }

      const payload = {
        ...(actualCostAmount !== undefined ? { actualCostAmount } : {}),
        ...(actualLeadTimeDays !== undefined ? { actualLeadTimeDays } : {}),
        ...(form.source.trim() ? { source: form.source.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        promoteConfidence: form.promoteConfidence,
      };

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch(
          `/api/logistics/lane-versions/${form.laneVersionId}/actuals`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = (await response.json().catch(() => null)) as {
          ok?: boolean;
        } | null;
        if (!response.ok || !data?.ok) {
          setMessage(strings.messages.createActualsError);
        } else {
          setMessage(strings.messages.createActualsSuccess);
          setForm(DEFAULT_FORM);
          await onCreated();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.createActualsError);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onCreated, strings.messages],
  );

  const disabled = loading || submitting;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.actuals.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.actuals.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.versionLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.laneVersionId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                laneVersionId: event.target.value,
              }))
            }
            disabled={disabled}
          >
            <option value="">{strings.placeholders.selectVersion}</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel ??
                  `${version.confidence ?? ""} ${version.createdAt ?? ""}`.trim()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.actualCostAmount}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.actualCostAmount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                actualCostAmount: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
            step="0.01"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.actualLeadTimeDays}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.actualLeadTimeDays}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                actualLeadTimeDays: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
            step="1"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.actualsSource}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.source}
            onChange={(event) =>
              setForm((current) => ({ ...current, source: event.target.value }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.actualsNotes}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          <input
            className="h-4 w-4 min-h-12 min-w-12 shrink-0 rounded border border-border-2"
            checked={form.promoteConfidence}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                promoteConfidence: event.target.checked,
              }))
            }
            disabled={disabled}
            type="checkbox"
          />
          {strings.actuals.promoteLabel}
        </label>
        <div className="text-xs text-foreground/60 md:col-span-2">
          {strings.actuals.promoteHelp}
        </div>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message ?? strings.notAvailable}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={disabled}
          >
            {strings.actuals.action}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
