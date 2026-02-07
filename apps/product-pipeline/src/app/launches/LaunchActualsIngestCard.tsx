"use client";

import { type FormEvent,useCallback, useState } from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

import type { LaunchesStrings,LaunchOption } from "./types";

const DEFAULT_INGEST = {
  launchId: "",
  csv: "",
  actualCostAmount: "",
  actualLeadTimeDays: "",
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

export default function LaunchActualsIngestCard({
  launches,
  loading,
  strings,
  onIngested,
}: {
  launches: LaunchOption[];
  loading: boolean;
  strings: LaunchesStrings;
  onIngested: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_INGEST);
  const [message, setMessage] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);

  const handleIngest = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.launchId || !form.csv.trim()) {
        setMessage(strings.messages.ingestError);
        return;
      }

      const actualCostAmount = parseNumber(form.actualCostAmount);
      const actualLeadTimeDays = parseIntValue(form.actualLeadTimeDays);
      if (actualCostAmount === null || actualLeadTimeDays === null) {
        setMessage(strings.messages.ingestError);
        return;
      }

      setIngesting(true);
      setMessage(null);
      try {
        const response = await fetch("/api/launches/actuals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            launchId: form.launchId,
            csv: form.csv,
            ...(actualCostAmount !== undefined ? { actualCostAmount } : {}),
            ...(actualLeadTimeDays !== undefined ? { actualLeadTimeDays } : {}),
          }),
        });
        if (!response.ok) {
          setMessage(strings.messages.ingestError);
        } else {
          setMessage(strings.messages.ingestSuccess);
          setForm(DEFAULT_INGEST);
          await onIngested();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.ingestError);
      } finally {
        setIngesting(false);
      }
    },
    [form, onIngested, strings.messages],
  );

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.ingestLabel}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.ingestTitle}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4" onSubmit={handleIngest}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.launchPlan}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.launchId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                launchId: event.target.value,
              }))
            }
            disabled={ingesting || loading}
          >
            <option value="">{strings.placeholders.selectLaunch}</option>
            {launches.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.actualsCsv}
          <textarea
            className="mt-2 min-h-40 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.csv}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                csv: event.target.value,
              }))
            }
            disabled={ingesting || loading}
          />
          <span className="mt-2 block text-xs text-foreground/60">
            {strings.fields.actualsHelper}
          </span>
        </label>
        <div className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.laneActualsLabel}
        </div>
        <div className="text-xs text-foreground/60">
          {strings.fields.laneActualsHelp}
        </div>
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
            disabled={ingesting || loading}
            type="number"
            min={0}
            step="0.01"
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
            disabled={ingesting || loading}
            type="number"
            min={0}
            step="1"
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3">
          <span className="text-xs text-foreground/60">
            {message ?? strings.notAvailable}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={ingesting || loading}
          >
            {strings.actions.ingest}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
