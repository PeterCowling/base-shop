"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type {
  CandidateDetail,
  CandidateDetailStrings,
  StageMCaptureMode,
  StageMFormState,
  StageMKind,
  StageRun,
} from "./types";
import StageMSummaryCard from "./StageMSummary";
import { extractStageMSummary } from "./stageMHelpers";

type RunnerStatus = {
  runnerId?: string | null;
  lastSeen?: string | null;
  stale?: boolean | null;
  mode?: string | null;
  headless?: boolean | null;
  sessionProfile?: string | null;
};

const CAPTURE_PROFILE_PATTERN = /^[a-zA-Z0-9._-]+$/;

function formatRunnerAge(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return fallback;
  const diffMs = Math.max(0, Date.now() - timestamp);
  if (diffMs < 1000) return "now";
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h`;
}

export default function StageMQueueCard({
  candidateId,
  candidate,
  stageRuns,
  loading,
  strings,
  onQueued,
}: {
  candidateId: string;
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  loading: boolean;
  strings: CandidateDetailStrings;
  onQueued: () => Promise<void>;
}) {
  const [queueing, setQueueing] = useState(false);
  const [queueMessage, setQueueMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus | null>(null);
  const [runnerStatusLoading, setRunnerStatusLoading] = useState(false);
  const [form, setForm] = useState<StageMFormState>({
    kind: "amazon_search",
    captureMode: "runner",
    captureProfile: "",
    marketplace: "de",
    query: "",
    url: "",
    maxResults: "20",
  });

  useEffect(() => {
    if (!candidate) return;
    setForm((current) => ({
      ...current,
      query: current.query || candidate.lead?.title || "",
      url: current.url || candidate.lead?.url || "",
    }));
  }, [candidate]);

  const loadRunnerStatus = useCallback(async () => {
    if (form.captureMode !== "runner") return;
    setRunnerStatusLoading(true);
    try {
      const response = await fetch("/api/runner/status");
      if (!response.ok) {
        setRunnerStatus(null);
        return;
      }
      const payload = (await response.json().catch(() => null)) as
        | { runner?: RunnerStatus | null }
        | null;
      setRunnerStatus(payload?.runner ?? null);
    } catch (error) {
      console.error(error);
      setRunnerStatus(null);
    } finally {
      setRunnerStatusLoading(false);
    }
  }, [form.captureMode]);

  useEffect(() => {
    if (form.captureMode !== "runner") return;
    loadRunnerStatus();
    const interval = setInterval(loadRunnerStatus, 15000);
    return () => clearInterval(interval);
  }, [form.captureMode, loadRunnerStatus]);

  const stageMActive = useMemo(
    () =>
      stageRuns.some(
        (run) =>
          run.stage === "M" &&
          (run.status === "queued" || run.status === "running"),
      ),
    [stageRuns],
  );
  const latestStageM = useMemo(
    () => stageRuns.find((run) => run.stage === "M" && run.status === "succeeded"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageMSummary(latestStageM),
    [latestStageM],
  );
  const cooldownActive = Boolean(candidate?.cooldown?.active);
  const statusLabel = cooldownActive
    ? strings.cooldown.activeMessage
    : stageMActive
      ? strings.stageM.queueingLabel
      : candidate
        ? strings.stageM.readyLabel
        : strings.notAvailable;
  const fieldsDisabled = queueing || loading || !candidate || cooldownActive;
  const runnerStatusText = useMemo(() => {
    if (form.captureMode !== "runner") return null;
    if (runnerStatusLoading && !runnerStatus) {
      return strings.stageM.runnerStatusChecking;
    }
    if (!runnerStatus) {
      return strings.stageM.runnerStatusUnknown;
    }
    const statusLabel = runnerStatus.stale
      ? strings.stageM.runnerStatusStale
      : strings.stageM.runnerStatusReady;
    const parts = [statusLabel];
    const lastSeen = formatRunnerAge(runnerStatus.lastSeen, strings.notAvailable);
    if (runnerStatus.lastSeen) {
      parts.push(`${strings.stageM.runnerStatusLastSeen}: ${lastSeen}`);
    }
    if (runnerStatus.mode) {
      parts.push(`${strings.stageM.runnerStatusMode}: ${runnerStatus.mode}`);
    }
    if (runnerStatus.headless !== null && runnerStatus.headless !== undefined) {
      parts.push(
        `${strings.stageM.runnerStatusBrowser}: ${
          runnerStatus.headless
            ? strings.stageM.summaryHeadlessOn
            : strings.stageM.summaryHeadlessOff
        }`,
      );
    }
    if (runnerStatus.sessionProfile) {
      parts.push(
        `${strings.stageM.runnerStatusSession}: ${runnerStatus.sessionProfile}`,
      );
    }
    return parts.join(" | ");
  }, [
    form.captureMode,
    runnerStatus,
    runnerStatusLoading,
    strings.stageM,
    strings.notAvailable,
  ]);
  const runnerStatusTone =
    runnerStatus && runnerStatus.stale === false
      ? "text-emerald-600"
      : runnerStatus && runnerStatus.stale
        ? "text-amber-600"
        : "text-foreground/60";

  const queueStageM = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setQueueMessage(null);
      setQueueing(true);
      const trimmedMarketplace = form.marketplace.trim();
      const trimmedQuery = form.query.trim();
      const trimmedUrl = form.url.trim();
      const trimmedCaptureProfile = form.captureProfile.trim();
      const maxResultsParsed = Number.parseInt(form.maxResults, 10);
      const maxResults = Number.isFinite(maxResultsParsed)
        ? maxResultsParsed
        : undefined;

      if (trimmedCaptureProfile && !CAPTURE_PROFILE_PATTERN.test(trimmedCaptureProfile)) {
        setQueueMessage({
          tone: "error",
          text: strings.stageM.captureProfileErrorInvalid,
        });
        setQueueing(false);
        return;
      }

      if (form.captureMode === "runner" && !trimmedCaptureProfile) {
        setQueueMessage({
          tone: "error",
          text: strings.stageM.captureProfileErrorRequired,
        });
        setQueueing(false);
        return;
      }

      const payload: {
        candidateId: string;
        kind: StageMKind;
        captureMode?: StageMCaptureMode;
        captureProfile?: string;
        marketplace?: string;
        query?: string;
        url?: string;
        maxResults?: number;
      } = {
        candidateId,
        kind: form.kind,
        captureMode: form.captureMode,
        ...(maxResults ? { maxResults } : {}),
        ...(trimmedCaptureProfile ? { captureProfile: trimmedCaptureProfile } : {}),
      };

      if (form.kind === "amazon_search") {
        const query = trimmedQuery || candidate.lead?.title?.trim() || "";
        if (!query || !trimmedMarketplace) {
          setQueueMessage({
            tone: "error",
            text: strings.stageM.errorMessage,
          });
          setQueueing(false);
          return;
        }
        payload.query = query;
        payload.marketplace = trimmedMarketplace;
      }

      if (form.kind === "amazon_listing") {
        const url = trimmedUrl || candidate.lead?.url?.trim() || "";
        if (!url || !trimmedMarketplace) {
          setQueueMessage({
            tone: "error",
            text: strings.stageM.errorMessage,
          });
          setQueueing(false);
          return;
        }
        payload.url = url;
        payload.marketplace = trimmedMarketplace;
      }

      if (form.kind === "taobao_listing") {
        const url = trimmedUrl || candidate.lead?.url?.trim() || "";
        if (!url) {
          setQueueMessage({
            tone: "error",
            text: strings.stageM.errorMessage,
          });
          setQueueing(false);
          return;
        }
        payload.url = url;
      }

      try {
        const response = await fetch("/api/stages/m/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const responsePayload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              details?: {
                reasonCode?: string;
                site?: string;
                dailyLimit?: number;
                dailyUsed?: number;
              };
            }
          | null;
        if (!response.ok) {
          const reason = responsePayload?.details?.reasonCode;
          const site = responsePayload?.details?.site;
          const siteLabel = site === "taobao" ? "Taobao" : "Amazon";
          const budgetMessage = strings.stageM.budgetMessage.replace(
            "{site}",
            siteLabel,
          );
          const message =
            responsePayload?.error === "cooldown_active"
              ? `${strings.cooldown.activeMessage}${reason ? ` (${reason})` : ""}`
              : responsePayload?.error === "budget_exceeded"
                ? budgetMessage
                : responsePayload?.error === "capture_profile_required"
                  ? strings.stageM.captureProfileErrorRequired
                  : responsePayload?.error === "capture_profile_invalid"
                    ? strings.stageM.captureProfileErrorInvalid
                    : responsePayload?.error === "capture_profile_not_allowed"
                      ? strings.stageM.captureProfileErrorNotAllowed
              : strings.stageM.errorMessage;
          setQueueMessage({ tone: "error", text: message });
        } else {
          setQueueMessage({
            tone: "success",
            text: strings.stageM.successMessage,
          });
        }
      } catch (error) {
        console.error(error);
        setQueueMessage({
          tone: "error",
          text: strings.stageM.errorMessage,
        });
      } finally {
        setQueueing(false);
        await onQueued();
      }
    },
    [candidate, candidateId, form, onQueued, strings.stageM, strings.cooldown],
  );

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageM.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageM.title}
        </h2>
      </Stack>
      <StageMSummaryCard
        summary={latestSummary}
        strings={strings.stageM}
        notAvailable={strings.notAvailable}
      />
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={queueStageM}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageM.kindLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.kind}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                kind: event.target.value as StageMKind,
              }))
            }
            disabled={fieldsDisabled}
          >
            <option
              value={
                "amazon_search" /* i18n-exempt -- PP-1100 stage enum value [ttl=2026-06-30] */
              }
            >
              {strings.stageM.kindAmazonSearch}
            </option>
            <option
              value={
                "amazon_listing" /* i18n-exempt -- PP-1100 stage enum value [ttl=2026-06-30] */
              }
            >
              {strings.stageM.kindAmazonListing}
            </option>
            <option
              value={
                "taobao_listing" /* i18n-exempt -- PP-1100 stage enum value [ttl=2026-06-30] */
              }
            >
              {strings.stageM.kindTaobaoListing}
            </option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageM.captureModeLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.captureMode}
            onChange={(event) => {
              const nextMode = event.target.value as StageMCaptureMode;
              setForm((current) => ({
                ...current,
                captureMode: nextMode,
                captureProfile: nextMode === "runner" ? current.captureProfile : "",
              }));
            }}
            disabled={fieldsDisabled}
          >
            <option
              value={
                "queue" /* i18n-exempt -- PP-1100 stage enum value [ttl=2026-06-30] */
              }
            >
              {strings.stageM.captureModeQueue}
            </option>
            <option
              value={
                "runner" /* i18n-exempt -- PP-1100 stage enum value [ttl=2026-06-30] */
              }
            >
              {strings.stageM.captureModeRunner}
            </option>
          </select>
        </label>
        {form.captureMode === "runner" && (
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.stageM.captureProfileLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.captureProfile}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  captureProfile: event.target.value,
                }))
              }
              disabled={fieldsDisabled}
              type="text"
              placeholder={strings.stageM.captureProfilePlaceholder}
              pattern={CAPTURE_PROFILE_PATTERN.source}
            />
            <span className="mt-2 block text-xs text-foreground/60 normal-case tracking-normal">
              {strings.stageM.captureProfileHelp}
            </span>
          </label>
        )}
        {form.captureMode === "runner" && (
          <div className="md:col-span-2 rounded-2xl border border-border-1 bg-surface-1 px-3 py-2 text-xs">
            <span className="block text-xs uppercase tracking-widest text-foreground/60">
              {strings.stageM.runnerStatusLabel}
            </span>
            <span className={`mt-1 block ${runnerStatusTone}`}>
              {runnerStatusText ?? strings.stageM.runnerStatusUnknown}
            </span>
          </div>
        )}
        {(form.kind === "amazon_search" || form.kind === "amazon_listing") && (
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.stageM.marketplaceLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.marketplace}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  marketplace: event.target.value,
                }))
              }
              disabled={fieldsDisabled}
              type="text"
            />
          </label>
        )}
        {form.kind === "amazon_search" && (
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.stageM.queryLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.query}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              disabled={fieldsDisabled}
              type="text"
            />
          </label>
        )}
        {(form.kind === "amazon_listing" || form.kind === "taobao_listing") && (
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.stageM.urlLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  url: event.target.value,
                }))
              }
              disabled={fieldsDisabled}
              type="url"
            />
          </label>
        )}
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageM.maxResultsLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.maxResults}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maxResults: event.target.value,
              }))
            }
            disabled={fieldsDisabled}
            type="number"
            min={1}
            max={100}
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          {queueMessage ? (
            <span
              className={
                queueMessage.tone === "success"
                  ? ("text-xs text-emerald-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
                  : ("text-xs text-red-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
              }
            >
              {queueMessage.text}
            </span>
          ) : (
            <span className="text-xs text-foreground/60">{statusLabel}</span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={queueing || stageMActive || loading || !candidate || cooldownActive}
          >
            {queueing ? strings.stageM.queueingLabel : strings.stageM.runLabel}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
