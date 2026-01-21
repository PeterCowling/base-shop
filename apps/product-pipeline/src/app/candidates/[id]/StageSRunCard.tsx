"use client";

/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */

import { type FormEvent,useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import { resolveGateMessage, resolveStageTGate } from "./stageGate";
import {
  extractStageSInput,
  extractStageSSummary,
  formatStageSList,
  parseStageSList,
} from "./stageSHelpers";
import StageSSummaryCard from "./StageSSummary";
import type {
  CandidateDetail,
  CandidateDetailStrings,
  StageRun,
  StageSRiskBand,
} from "./types";

type FormState = {
  complianceRisk: StageSRiskBand;
  ipRisk: StageSRiskBand;
  hazmatRisk: StageSRiskBand;
  shippingRisk: StageSRiskBand;
  listingRisk: StageSRiskBand;
  packagingRisk: StageSRiskBand;
  matchingConfidence: string;
  artifactsRequired: string;
  notes: string;
};

type RiskFieldKey =
  | "complianceRisk"
  | "ipRisk"
  | "hazmatRisk"
  | "shippingRisk"
  | "listingRisk"
  | "packagingRisk";

const DEFAULT_FORM: FormState = {
  complianceRisk: "medium",
  ipRisk: "medium",
  hazmatRisk: "low",
  shippingRisk: "medium",
  listingRisk: "medium",
  packagingRisk: "medium",
  matchingConfidence: "60",
  artifactsRequired: "",
  notes: "",
};


export default function StageSRunCard({
  candidateId,
  candidate,
  stageRuns,
  loading,
  strings,
  onRun,
}: {
  candidateId: string;
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  loading: boolean;
  strings: CandidateDetailStrings;
  onRun: () => Promise<void>;
}) {
  const latestStageS = useMemo(
    () => stageRuns.find((run) => run.stage === "S"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageSSummary(latestStageS),
    [latestStageS],
  );

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const cooldownActive = Boolean(candidate?.cooldown?.active);
  const stageGate = resolveStageTGate(stageRuns);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageSInput(latestStageS);
    if (!input) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      complianceRisk: input.complianceRisk ?? "medium",
      ipRisk: input.ipRisk ?? "medium",
      hazmatRisk: input.hazmatRisk ?? "low",
      shippingRisk: input.shippingRisk ?? "medium",
      listingRisk: input.listingRisk ?? "medium",
      packagingRisk: input.packagingRisk ?? "medium",
      matchingConfidence:
        input.matchingConfidence !== undefined
          ? String(input.matchingConfidence)
          : "60",
      artifactsRequired: formatStageSList(input.artifactsRequired),
      notes: input.notes ?? "",
    });
  }, [hasEdited, latestStageS]);

  const runStageS = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);
      const confidenceRaw = form.matchingConfidence.trim();
      const matchingConfidence =
        confidenceRaw === ""
          ? undefined
          : Number.parseFloat(confidenceRaw);
      if (
        matchingConfidence !== undefined &&
        (!Number.isFinite(matchingConfidence) ||
          matchingConfidence < 0 ||
          matchingConfidence > 100)
      ) {
        setMessage({ tone: "error", text: strings.stageS.errorInvalid });
        setRunning(false);
        return;
      }

      const payload: {
        candidateId: string;
        complianceRisk: StageSRiskBand;
        ipRisk: StageSRiskBand;
        hazmatRisk: StageSRiskBand;
        shippingRisk: StageSRiskBand;
        listingRisk: StageSRiskBand;
        packagingRisk: StageSRiskBand;
        matchingConfidence?: number;
        artifactsRequired?: string[];
        notes?: string;
      } = {
        candidateId,
        complianceRisk: form.complianceRisk,
        ipRisk: form.ipRisk,
        hazmatRisk: form.hazmatRisk,
        shippingRisk: form.shippingRisk,
        listingRisk: form.listingRisk,
        packagingRisk: form.packagingRisk,
        ...(matchingConfidence !== undefined ? { matchingConfidence } : {}),
      };

      const artifacts = parseStageSList(form.artifactsRequired);
      if (artifacts.length > 0) payload.artifactsRequired = artifacts;
      if (form.notes.trim()) payload.notes = form.notes.trim();

      try {
        const response = await fetch("/api/stages/s/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => null)) as
          | { error?: string; details?: { reasonCode?: string } }
          | null;
        if (!response.ok) {
          const reason = data?.details?.reasonCode;
          const gateError = resolveGateMessage(data?.error ?? null, strings.gates);
          const text =
            gateError ??
            (data?.error === "cooldown_active"
              ? `${strings.cooldown.activeMessage}${reason ? ` (${reason})` : ""}`
              : strings.stageS.errorRun);
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageS.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageS.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidate, candidateId, form, onRun, strings.cooldown, strings.gates, strings.stageS],
  );

  const riskFields: Array<{ key: RiskFieldKey; label: string }> = [
    { key: "complianceRisk", label: strings.stageS.inputComplianceRisk },
    { key: "ipRisk", label: strings.stageS.inputIpRisk },
    { key: "hazmatRisk", label: strings.stageS.inputHazmatRisk },
    { key: "shippingRisk", label: strings.stageS.inputShippingRisk },
    { key: "listingRisk", label: strings.stageS.inputListingRisk },
    { key: "packagingRisk", label: strings.stageS.inputPackagingRisk },
  ];

  const riskOptions: Array<{ value: StageSRiskBand; label: string }> = [
    { value: "low", label: strings.stageS.riskBands.low },
    { value: "medium", label: strings.stageS.riskBands.medium },
    { value: "high", label: strings.stageS.riskBands.high },
  ];

  return (
    <section className="pp-card p-6" id="stage-s">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageS.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageS.title}
        </h2>
      </Stack>

      <StageSSummaryCard
        summary={latestSummary}
        strings={strings.stageS}
        notAvailable={strings.notAvailable}
      />

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
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageS}>
        {riskFields.map((field) => (
          <label
            key={field.key}
            className="text-xs uppercase tracking-widest text-foreground/60"
          >
            {field.label}
            <select
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form[field.key]}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  [field.key]: event.target.value as StageSRiskBand,
                }));
                setHasEdited(true);
              }}
              disabled={running || cooldownActive || Boolean(stageGate)}
            >
              {riskOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageS.inputMatchingConfidence}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.matchingConfidence}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                matchingConfidence: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive || Boolean(stageGate)}
            type="number"
            min={0}
            max={100}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageS.inputArtifactsRequired}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.artifactsRequired}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                artifactsRequired: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive || Boolean(stageGate)}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageS.inputNotes}
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) => {
              setForm((current) => ({ ...current, notes: event.target.value }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive || Boolean(stageGate)}
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
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
              {cooldownActive
                ? strings.cooldown.activeMessage
                : strings.stageS.inputHelp}
            </span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={running || loading || cooldownActive || Boolean(stageGate)}
          >
            {strings.stageS.runLabel}
          </button>
        </Cluster>
      </form>
      ) : null}
    </section>
  );
}
