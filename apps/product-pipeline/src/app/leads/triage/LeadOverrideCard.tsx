"use client";

import { type FormEvent,useCallback, useState } from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

import type { LeadTriageStrings } from "./types";

type OverrideFormState = {
  reason: string;
  requestedBy: string;
};

export default function LeadOverrideCard({
  strings,
  selectedCount,
  onApply,
}: {
  strings: LeadTriageStrings;
  selectedCount: number;
  onApply: (reason: string, requestedBy: string) => Promise<void>;
}) {
  const [form, setForm] = useState<OverrideFormState>({
    reason: "",
    requestedBy: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.reason.trim() || selectedCount === 0) {
        return;
      }

      setSubmitting(true);
      try {
        await onApply(form.reason.trim(), form.requestedBy.trim());
        setForm({ reason: "", requestedBy: "" });
      } finally {
        setSubmitting(false);
      }
    },
    [form.reason, form.requestedBy, onApply, selectedCount],
  );

  const disabled = submitting || selectedCount === 0;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.override.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.override.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.override.reasonLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.reason}
            onChange={(event) =>
              setForm((current) => ({ ...current, reason: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.override.requestedByLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.requestedBy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requestedBy: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {selectedCount === 0 ? strings.override.noSelection : strings.override.apply}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={disabled || !form.reason.trim()}
          >
            {strings.override.apply}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
