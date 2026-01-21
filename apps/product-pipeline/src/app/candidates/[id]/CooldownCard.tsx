/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { type FormEvent,useCallback, useMemo, useState } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import type {
  CandidateDetail,
  CandidateDetailStrings,
  CooldownSeverity,
} from "./types";

type FormState = {
  reasonCode: string;
  severity: CooldownSeverity;
  recheckDays: string;
  whatWouldChange: string;
};

const DEFAULT_FORM: FormState = {
  reasonCode: "",
  severity: "short_cooldown",
  recheckDays: "21",
  whatWouldChange: "",
};

function formatRecheck(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toLocaleDateString("en-GB");
}

function formatSeverity(
  severity: string | null | undefined,
  strings: CandidateDetailStrings["cooldown"],
): string {
  if (!severity) return strings.severityShort;
  if (severity === "permanent") return strings.severityPermanent;
  if (severity === "long_cooldown") return strings.severityLong;
  return strings.severityShort;
}

export default function CooldownCard({
  candidateId,
  candidate,
  loading,
  strings,
  onUpdated,
}: {
  candidateId: string;
  candidate: CandidateDetail | null;
  loading: boolean;
  strings: CandidateDetailStrings;
  onUpdated: () => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const cooldown = candidate?.cooldown ?? null;
  const activeLabel = cooldown?.active
    ? strings.cooldown.activeLabel
    : strings.cooldown.noneLabel;
  const helperMessage = cooldown?.active
    ? strings.cooldown.activeMessage
    : strings.cooldown.noneMessage;
  const recheckLabel = formatRecheck(
    cooldown?.recheckAfter ?? null,
    strings.cooldown.severityPermanent,
  );
  const severityLabel = formatSeverity(cooldown?.severity, strings.cooldown);

  const submitCooldown = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;
      const reasonCode = form.reasonCode.trim();
      const whatWouldChange = form.whatWouldChange.trim();
      if (!reasonCode || !whatWouldChange) {
        setMessage({ tone: "error", text: strings.cooldown.errorMessage });
        return;
      }

      const payload: {
        candidateId: string;
        reasonCode: string;
        severity: CooldownSeverity;
        whatWouldChange: string;
        recheckAfterDays?: number;
      } = {
        candidateId,
        reasonCode,
        severity: form.severity,
        whatWouldChange,
      };

      if (form.severity !== "permanent") {
        const daysParsed = Number.parseInt(form.recheckDays, 10);
        if (!Number.isFinite(daysParsed) || daysParsed <= 0) {
          setMessage({ tone: "error", text: strings.cooldown.errorMessage });
          return;
        }
        payload.recheckAfterDays = daysParsed;
      }

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch("/api/cooldowns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          setMessage({ tone: "error", text: strings.cooldown.errorMessage });
        } else {
          setMessage({ tone: "success", text: strings.cooldown.successMessage });
          setForm(DEFAULT_FORM);
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.cooldown.errorMessage });
      } finally {
        setSubmitting(false);
        await onUpdated();
      }
    },
    [
      candidate,
      candidateId,
      form.reasonCode,
      form.recheckDays,
      form.severity,
      form.whatWouldChange,
      onUpdated,
      strings.cooldown,
    ],
  );

  const disabled = submitting || loading || !candidate;
  const activeSummary = useMemo(() => {
    if (!cooldown?.active) return null;
    return {
      reason: cooldown.reasonCode,
      severity: severityLabel,
      recheck: recheckLabel,
      change: cooldown.whatWouldChange ?? strings.notAvailable,
    };
  }, [cooldown, recheckLabel, severityLabel, strings.notAvailable]);

  return (
    <section className="pp-card p-6" id="cooldown">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.cooldown.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.cooldown.title}
        </h2>
      </Stack>

      <div className="mt-4 rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-sm">
        <div className="text-xs text-foreground/60">{activeLabel}</div>
        {activeSummary ? (
          <Stack gap={2} className="mt-2 text-sm">
            <div>
              <span className="text-xs text-foreground/60">
                {strings.cooldown.reasonLabel}
              </span>
              <div className="font-semibold">{activeSummary.reason}</div>
            </div>
            <div>
              <span className="text-xs text-foreground/60">
                {strings.cooldown.severityLabel}
              </span>
              <div className="font-semibold">{activeSummary.severity}</div>
            </div>
            <div>
              <span className="text-xs text-foreground/60">
                {strings.cooldown.recheckLabel}
              </span>
              <div className="font-semibold">{activeSummary.recheck}</div>
            </div>
            <div>
              <span className="text-xs text-foreground/60">
                {strings.cooldown.whatWouldChangeLabel}
              </span>
              <div className="font-semibold">{activeSummary.change}</div>
            </div>
          </Stack>
        ) : (
          <div className="mt-2 text-xs text-foreground/60">
            {helperMessage}
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? strings.common.hideInputs : strings.common.editInputs}
        </button>
      </div>

      {expanded ? (
        <form className="mt-4 grid gap-4" onSubmit={submitCooldown}>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.cooldown.reasonLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.reasonCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reasonCode: event.target.value,
                }))
              }
              disabled={disabled}
              type="text"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.cooldown.severityLabel}
            <select
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.severity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  severity: event.target.value as CooldownSeverity,
                }))
              }
              disabled={disabled}
            >
              <option
                value={
                  "short_cooldown" /* i18n-exempt -- PP-1100 cooldown enum value [ttl=2026-06-30] */
                }
              >
                {strings.cooldown.severityShort}
              </option>
              <option
                value={
                  "long_cooldown" /* i18n-exempt -- PP-1100 cooldown enum value [ttl=2026-06-30] */
                }
              >
                {strings.cooldown.severityLong}
              </option>
              <option
                value={
                  "permanent" /* i18n-exempt -- PP-1100 cooldown enum value [ttl=2026-06-30] */
                }
              >
                {strings.cooldown.severityPermanent}
              </option>
            </select>
          </label>
          {form.severity !== "permanent" ? (
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.cooldown.recheckLabel}
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
                max={3650}
              />
            </label>
          ) : null}
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.cooldown.whatWouldChangeLabel}
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
          <Cluster justify="between" alignY="center" className="gap-3">
            {message ? (
              <span
                className={
                  message.tone === "success"
                    ? ("text-xs text-emerald-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
                    : ("text-xs text-red-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
                }
              >
                {message.text}
              </span>
            ) : (
              <span className="text-xs text-foreground/60">
                {helperMessage}
              </span>
            )}
            <button
              className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={disabled}
            >
              {strings.cooldown.submitLabel}
            </button>
          </Cluster>
        </form>
      ) : null}
    </section>
  );
}
