"use client";

import { type FormEvent,useCallback, useEffect, useState } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import type { LeadTriageStrings } from "./types";

type CooldownFormState = {
  reasonCode: string;
  severity: "short_cooldown" | "long_cooldown" | "permanent";
  whatWouldChange: string;
  recheckDays: string;
};

export default function LeadCooldownCard({
  strings,
  selectedCount,
  onApply,
}: {
  strings: LeadTriageStrings;
  selectedCount: number;
  onApply: (form: CooldownFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<CooldownFormState>({
    reasonCode: "low_signal",
    severity: "short_cooldown",
    whatWouldChange: strings.cooldown.defaultWhatWouldChange,
    recheckDays: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      whatWouldChange: current.whatWouldChange || strings.cooldown.defaultWhatWouldChange,
    }));
  }, [strings.cooldown.defaultWhatWouldChange]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (selectedCount === 0) return;
      setSubmitting(true);
      try {
        await onApply(form);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onApply, selectedCount],
  );

  const disabled = submitting || selectedCount === 0;
  const reasonOptions = [
    { value: "low_signal", label: strings.options.reasonLowSignal },
    { value: "hazmat_keyword", label: strings.options.reasonHazmatKeyword },
    { value: "price_too_low", label: strings.options.reasonPriceTooLow },
    { value: "price_too_high", label: strings.options.reasonPriceTooHigh },
    { value: "price_high", label: strings.options.reasonPriceHigh },
    { value: "short_title", label: strings.options.reasonShortTitle },
    { value: "duplicate_existing", label: strings.options.reasonDuplicateExisting },
    { value: "duplicate_batch", label: strings.options.reasonDuplicateBatch },
    { value: "policy_blocked", label: strings.options.reasonPolicyBlocked },
  ];
  const severityOptions = [
    { value: "short_cooldown", label: strings.options.severityShort },
    { value: "long_cooldown", label: strings.options.severityLong },
    { value: "permanent", label: strings.options.severityPermanent },
  ];

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.cooldown.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.cooldown.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.cooldown.reason}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.reasonCode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reasonCode: event.target.value,
              }))
            }
            disabled={disabled}
          >
            {reasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.cooldown.severity}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.severity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                severity: event.target.value as CooldownFormState["severity"],
              }))
            }
            disabled={disabled}
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.cooldown.whatWouldChange}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.whatWouldChange}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                whatWouldChange: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.cooldown.recheckDays}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.recheckDays}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                recheckDays: event.target.value,
              }))
            }
            disabled={disabled}
            type="number"
            min={1}
            step={1}
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {selectedCount === 0 ? strings.cooldown.noSelection : strings.cooldown.apply}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={disabled || !form.whatWouldChange.trim()}
          >
            {strings.actions.rejectCooldown}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
