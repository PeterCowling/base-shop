"use client";

import { type FormEvent,useCallback, useState } from "react";
import { Cluster, Stack } from "@acme/design-system/primitives";

import type { LogisticsStrings } from "./types";

const DEFAULT_FORM = {
  name: "",
  model: "A",
  origin: "",
  destination: "",
  destinationType: "",
  incoterm: "",
  description: "",
  active: true,
};

export default function LaneCreateCard({
  loading,
  strings,
  onCreated,
}: {
  loading: boolean;
  strings: LogisticsStrings;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const modelOptions = [
    { value: "A", label: strings.options.modelA },
    { value: "B", label: strings.options.modelB },
    { value: "C", label: strings.options.modelC },
    { value: "D", label: strings.options.modelD },
  ];

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = form.name.trim();
      const model = form.model.trim();
      if (!name || !model) {
        setMessage(strings.messages.createLaneError);
        return;
      }

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch("/api/logistics/lanes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            model,
            origin: form.origin.trim() || undefined,
            destination: form.destination.trim() || undefined,
            destinationType: form.destinationType.trim() || undefined,
            incoterm: form.incoterm.trim() || undefined,
            description: form.description.trim() || undefined,
            active: form.active,
          }),
        });
        if (!response.ok) {
          setMessage(strings.messages.createLaneError);
        } else {
          setMessage(strings.messages.createLaneSuccess);
          setForm(DEFAULT_FORM);
          await onCreated();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.createLaneError);
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
          {strings.fields.model}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.model}
            onChange={(event) =>
              setForm((current) => ({ ...current, model: event.target.value }))
            }
            disabled={disabled}
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.description}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          <input
            className="h-4 w-4 min-h-12 min-w-12 shrink-0 rounded border border-border-2"
            checked={form.active}
            onChange={(event) =>
              setForm((current) => ({ ...current, active: event.target.checked }))
            }
            disabled={disabled}
            type="checkbox"
          />
          {strings.fields.active}
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
