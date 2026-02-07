"use client";

import { type FormEvent,useCallback, useState } from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

import type { LaneDetailStrings } from "./types";

const DEFAULT_FORM = {
  versionLabel: "",
  status: "active",
  confidence: "C0",
  expiresAt: "",
  currency: "EUR",
  sourceCurrency: "",
  fxRate: "",
  fxDate: "",
  fxSource: "",
  leadTimeLow: "",
  leadTimeBase: "",
  leadTimeHigh: "",
  costBasis: "",
  costAmount: "",
  costMinimum: "",
  includedNotes: "",
  excludedNotes: "",
  notes: "",
};

function parseNumber(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIntValue(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function LaneVersionCreateCard({
  laneId,
  loading,
  strings,
  onCreated,
}: {
  laneId: string;
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
      if (!form.currency.trim()) {
        setMessage(strings.messages.createVersionError);
        return;
      }

      const payload = {
        versionLabel: form.versionLabel.trim() || undefined,
        status: form.status.trim() || undefined,
        confidence: form.confidence.trim() || undefined,
        expiresAt: form.expiresAt.trim() || undefined,
        currency: form.currency.trim(),
        sourceCurrency: form.sourceCurrency.trim() || undefined,
        fxRate: parseNumber(form.fxRate),
        fxDate: form.fxDate.trim() || undefined,
        fxSource: form.fxSource.trim() || undefined,
        leadTimeLowDays: parseIntValue(form.leadTimeLow),
        leadTimeBaseDays: parseIntValue(form.leadTimeBase),
        leadTimeHighDays: parseIntValue(form.leadTimeHigh),
        costBasis: form.costBasis.trim() || undefined,
        costAmount: parseNumber(form.costAmount),
        costMinimum: parseNumber(form.costMinimum),
        includedNotes: form.includedNotes.trim() || undefined,
        excludedNotes: form.excludedNotes.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch(`/api/logistics/lanes/${laneId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          setMessage(strings.messages.createVersionError);
        } else {
          setMessage(strings.messages.createVersionSuccess);
          setForm(DEFAULT_FORM);
          await onCreated();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.createVersionError);
      } finally {
        setSubmitting(false);
      }
    },
    [form, laneId, onCreated, strings.messages],
  );

  const disabled = loading || submitting;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.version.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.version.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.versionLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.versionLabel}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                versionLabel: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.status}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value }))
            }
            disabled={disabled}
          >
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="superseded">superseded</option>
            <option value="expired">expired</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.confidence}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.confidence}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confidence: event.target.value,
              }))
            }
            disabled={disabled}
          >
            <option value="C0">C0</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="C3">C3</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.expiresAt}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.expiresAt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                expiresAt: event.target.value,
              }))
            }
            disabled={disabled}
            type="date"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.currency}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currency: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.sourceCurrency}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.sourceCurrency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sourceCurrency: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.fxRate}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.fxRate}
            onChange={(event) =>
              setForm((current) => ({ ...current, fxRate: event.target.value }))
            }
            disabled={disabled}
            type="number"
            step="0.0001"
            min={0}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.fxDate}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.fxDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, fxDate: event.target.value }))
            }
            disabled={disabled}
            type="date"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.fxSource}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.fxSource}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fxSource: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.leadTimeLow}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.leadTimeLow}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                leadTimeLow: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.leadTimeBase}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.leadTimeBase}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                leadTimeBase: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.leadTimeHigh}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.leadTimeHigh}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                leadTimeHigh: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.costBasis}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.costBasis}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                costBasis: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.costAmount}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.costAmount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                costAmount: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            step="0.01"
            min={0}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.costMinimum}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.costMinimum}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                costMinimum: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            step="0.01"
            min={0}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.includedNotes}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.includedNotes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                includedNotes: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.excludedNotes}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.excludedNotes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                excludedNotes: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
            placeholder={strings.placeholders.optional}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.notes}
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
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message ?? strings.notAvailable}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={disabled}
          >
            {strings.version.action}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
