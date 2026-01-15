"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type { LeadTriageStrings } from "./types";

type FingerprintOverrideFormState = {
  fingerprint: string;
  reason: string;
  requestedBy: string;
};

export default function LeadFingerprintOverrideCard({
  strings,
  selectedCount,
  onApply,
  onClear,
}: {
  strings: LeadTriageStrings;
  selectedCount: number;
  onApply: (fingerprint: string, reason: string, requestedBy: string) => Promise<void>;
  onClear: (requestedBy: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FingerprintOverrideFormState>({
    fingerprint: "",
    reason: "",
    requestedBy: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.fingerprint.trim() || !form.reason.trim() || selectedCount === 0) {
        return;
      }

      setSubmitting(true);
      try {
        await onApply(
          form.fingerprint.trim(),
          form.reason.trim(),
          form.requestedBy.trim(),
        );
        setForm((current) => ({ ...current, fingerprint: "", reason: "" }));
      } finally {
        setSubmitting(false);
      }
    },
    [form, onApply, selectedCount],
  );

  const handleClear = useCallback(async () => {
    if (selectedCount === 0) return;
    setSubmitting(true);
    try {
      await onClear(form.requestedBy.trim());
      setForm((current) => ({ ...current, fingerprint: "", reason: "" }));
    } finally {
      setSubmitting(false);
    }
  }, [form.requestedBy, onClear, selectedCount]);

  const disabled = submitting || selectedCount === 0;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fingerprintOverride.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.fingerprintOverride.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fingerprintOverride.fingerprintLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.fingerprint}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fingerprint: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fingerprintOverride.reasonLabel}
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
          {strings.fingerprintOverride.requestedByLabel}
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
            {selectedCount === 0
              ? strings.fingerprintOverride.noSelection
              : strings.fingerprintOverride.apply}
          </span>
          <Cluster gap={2} alignY="center">
            <button
              className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={handleClear}
              disabled={disabled}
            >
              {strings.fingerprintOverride.clear}
            </button>
            <button
              className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={disabled || !form.fingerprint.trim() || !form.reason.trim()}
            >
              {strings.fingerprintOverride.apply}
            </button>
          </Cluster>
        </Cluster>
      </form>
    </section>
  );
}
