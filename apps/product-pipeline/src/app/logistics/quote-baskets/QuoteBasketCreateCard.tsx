"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";
import type { QuoteBasketStrings } from "./types";

const DEFAULT_FORM = {
  name: "",
  profileType: "",
  origin: "",
  destination: "",
  destinationType: "",
  incoterm: "",
  cartonCount: "",
  unitsPerCarton: "",
  weightKg: "",
  cbm: "",
  dimensionsCm: "",
  hazmatFlag: false,
  notes: "",
};

type FormState = typeof DEFAULT_FORM;

function parseOptionalInt(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseOptionalNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export default function QuoteBasketCreateCard({
  loading,
  strings,
  onCreated,
}: {
  loading: boolean;
  strings: QuoteBasketStrings;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = form.name.trim();
      if (!name) {
        setMessage(strings.messages.createError);
        return;
      }

      const cartonCount = parseOptionalInt(form.cartonCount);
      const unitsPerCarton = parseOptionalInt(form.unitsPerCarton);
      const weightKg = parseOptionalNumber(form.weightKg);
      const cbm = parseOptionalNumber(form.cbm);
      if (
        cartonCount === null ||
        unitsPerCarton === null ||
        weightKg === null ||
        cbm === null
      ) {
        setMessage(strings.messages.createError);
        return;
      }

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch("/api/logistics/quote-baskets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            profileType: form.profileType.trim() || undefined,
            origin: form.origin.trim() || undefined,
            destination: form.destination.trim() || undefined,
            destinationType: form.destinationType.trim() || undefined,
            incoterm: form.incoterm.trim() || undefined,
            cartonCount,
            unitsPerCarton,
            weightKg,
            cbm,
            dimensionsCm: form.dimensionsCm.trim() || undefined,
            hazmatFlag: form.hazmatFlag,
            notes: form.notes.trim() || undefined,
          }),
        });
        if (!response.ok) {
          setMessage(strings.messages.createError);
        } else {
          setMessage(strings.messages.createSuccess);
          setForm(DEFAULT_FORM);
          await onCreated();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.createError);
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
          {strings.create.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.create.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.name}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.profileType}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.profileType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                profileType: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.origin}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.origin}
            onChange={(event) =>
              setForm((current) => ({ ...current, origin: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.destination}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.destination}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                destination: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.destinationType}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.destinationType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                destinationType: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.incoterm}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.incoterm}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                incoterm: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.cartonCount}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.cartonCount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cartonCount: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
            step={1}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.unitsPerCarton}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.unitsPerCarton}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                unitsPerCarton: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
            step={1}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.weightKg}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.weightKg}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                weightKg: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={0}
            step="0.01"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.cbm}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.cbm}
            onChange={(event) =>
              setForm((current) => ({ ...current, cbm: event.target.value }))
            }
            disabled={disabled}
            type="number"
            min={0}
            step="0.0001"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.dimensionsCm}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.dimensionsCm}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dimensionsCm: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
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
          />
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          <input
            className="h-4 w-4 min-h-12 min-w-12 shrink-0 rounded border border-border-2"
            checked={form.hazmatFlag}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                hazmatFlag: event.target.checked,
              }))
            }
            disabled={disabled}
            type="checkbox"
          />
          {strings.fields.hazmatFlag}
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
            {strings.create.action}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
