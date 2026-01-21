"use client";

import { type FormEvent,useCallback, useState } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import type { LaunchesStrings,LaunchOption } from "./types";

const DEFAULT_CREATE = {
  candidateId: "",
  plannedUnits: "",
  plannedUnitsPerDay: "",
  status: "PLANNED",
  notes: "",
};

export default function LaunchPlanCreateCard({
  candidates,
  loading,
  strings,
  onCreated,
}: {
  candidates: LaunchOption[];
  loading: boolean;
  strings: LaunchesStrings;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_CREATE);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const plannedUnits = Number.parseInt(form.plannedUnits, 10);
      const plannedUnitsPerDay = Number.parseFloat(form.plannedUnitsPerDay);
      if (!form.candidateId) {
        setMessage(strings.messages.createError);
        return;
      }

      setCreating(true);
      setMessage(null);
      try {
        const response = await fetch("/api/launches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: form.candidateId,
            status: form.status,
            plannedUnits: Number.isFinite(plannedUnits)
              ? plannedUnits
              : undefined,
            plannedUnitsPerDay: Number.isFinite(plannedUnitsPerDay)
              ? plannedUnitsPerDay
              : undefined,
            notes: form.notes.trim() || undefined,
          }),
        });
        if (!response.ok) {
          setMessage(strings.messages.createError);
        } else {
          setMessage(strings.messages.createSuccess);
          setForm(DEFAULT_CREATE);
          await onCreated();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.createError);
      } finally {
        setCreating(false);
      }
    },
    [form, onCreated, strings.messages],
  );

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.createLabel}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.createTitle}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.candidate}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.candidateId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                candidateId: event.target.value,
              }))
            }
            disabled={creating || loading}
          >
            <option value="">{strings.placeholders.selectCandidate}</option>
            {candidates.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.status}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            disabled={creating || loading}
          >
            <option
              value={
                "PLANNED" /* i18n-exempt -- PP-1100 status value [ttl=2026-06-30] */
              }
            >
              {strings.statusLabels.planned}
            </option>
            <option
              value={
                "PILOT" /* i18n-exempt -- PP-1100 status value [ttl=2026-06-30] */
              }
            >
              {strings.statusLabels.pilot}
            </option>
            <option
              value={
                "ACTUALS_INGESTED" /* i18n-exempt -- PP-1100 status value [ttl=2026-06-30] */
              }
            >
              {strings.statusLabels.ingested}
            </option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.plannedUnits}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.plannedUnits}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                plannedUnits: event.target.value,
              }))
            }
            disabled={creating || loading}
            type="number"
            min={1}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.plannedUnitsPerDay}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.plannedUnitsPerDay}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                plannedUnitsPerDay: event.target.value,
              }))
            }
            disabled={creating || loading}
            type="number"
            min={1}
            step="0.5"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.notes}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            disabled={creating || loading}
            type="text"
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message ?? strings.notAvailable}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={creating || loading}
          >
            {strings.actions.create}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
