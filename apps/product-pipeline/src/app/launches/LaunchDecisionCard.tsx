"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";
import type { LaunchOption, LaunchesStrings } from "./types";

const DEFAULT_DECISION = {
  launchId: "",
  decision: "SCALE",
  notes: "",
};

export default function LaunchDecisionCard({
  launches,
  loading,
  strings,
  onDecided,
}: {
  launches: LaunchOption[];
  loading: boolean;
  strings: LaunchesStrings;
  onDecided: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_DECISION);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDecision = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.launchId || !form.decision) {
        setMessage(strings.messages.decisionError);
        return;
      }

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch("/api/launches/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            launchId: form.launchId,
            decision: form.decision,
            notes: form.notes.trim() || undefined,
          }),
        });
        if (!response.ok) {
          setMessage(strings.messages.decisionError);
        } else {
          setMessage(strings.messages.decisionSuccess);
          setForm(DEFAULT_DECISION);
          await onDecided();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.decisionError);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onDecided, strings.messages],
  );

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.decisionLabel}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.decisionTitle}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleDecision}>
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
            disabled={submitting || loading}
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
          {strings.fields.decision}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.decision}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                decision: event.target.value,
              }))
            }
            disabled={submitting || loading}
          >
            <option
              value={
                "SCALE" /* i18n-exempt -- PP-1100 decision value [ttl=2026-06-30] */
              }
            >
              {strings.decisionLabels.scale}
            </option>
            <option
              value={
                "KILL" /* i18n-exempt -- PP-1100 decision value [ttl=2026-06-30] */
              }
            >
              {strings.decisionLabels.kill}
            </option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.decisionNotes}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            disabled={submitting || loading}
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
            disabled={submitting || loading}
          >
            {strings.actions.decide}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
