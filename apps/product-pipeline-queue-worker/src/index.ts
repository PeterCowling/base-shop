/* i18n-exempt file -- PP-1100 Stage M queue worker [ttl=2026-06-30] */

import type { Env, RunnerError, StageMJobInput, StageMQueueMessage } from "./types";
import { buildStageMOutputFromHtml, resolveCaptureUrl } from "./stageMParser";
import {
  completeStageRun,
  fetchStageRunById,
  markStageRunRunning,
  nowIso,
  storeHtmlArtifact,
} from "./storage";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_ACCEPT_LANGUAGE = "en-US,en;q=0.9";
const DEFAULT_CAPTURE_TIMEOUT_MS = 15000;
const DEFAULT_ARTIFACT_KIND = "snapshot_html";
const RUNNING_STALE_MINUTES = 30;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function resolveStageMInput(
  stageRunInput: string | null,
  message: StageMQueueMessage,
): StageMJobInput | null {
  const inputFromRun = safeJsonParse<StageMJobInput>(stageRunInput);
  const input = inputFromRun ?? message.input;
  if (!input || typeof input.kind !== "string") return null;
  return input;
}

function isRunningStale(
  startedAt: string | null,
  now: string,
  thresholdMinutes: number,
): boolean {
  if (!startedAt) return true;
  const startedMs = Date.parse(startedAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(startedMs) || !Number.isFinite(nowMs)) return true;
  return (nowMs - startedMs) / 60000 > thresholdMinutes;
}

async function fetchHtmlSnapshot(
  targetUrl: string,
  env: Env,
): Promise<{ html: string; sourceUrl: string }> {
  const timeoutRaw = env.PIPELINE_RUNNER_CAPTURE_TIMEOUT_MS ?? "";
  const parsedTimeout = Number.parseInt(timeoutRaw, 10);
  const timeoutMs = Number.isFinite(parsedTimeout)
    ? parsedTimeout
    : DEFAULT_CAPTURE_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml",
  };
  const userAgent = env.PIPELINE_RUNNER_USER_AGENT ?? DEFAULT_USER_AGENT;
  const acceptLanguage = env.PIPELINE_RUNNER_ACCEPT_LANGUAGE ?? DEFAULT_ACCEPT_LANGUAGE;
  if (userAgent) headers["User-Agent"] = userAgent;
  if (acceptLanguage) headers["Accept-Language"] = acceptLanguage;

  try {
    const response = await fetch(targetUrl, {
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`capture_failed (${response.status})`);
    }
    const html = await response.text();
    if (!html.trim()) {
      throw new Error("capture_empty");
    }
    return { html, sourceUrl: response.url || targetUrl };
  } finally {
    clearTimeout(timeout);
  }
}

function buildRunnerError(
  message: string,
  code: string,
  details?: Record<string, unknown>,
): RunnerError {
  return {
    message,
    code,
    ...(details ? { details } : {}),
  };
}

async function handleQueueMessage(
  message: Message<StageMQueueMessage>,
  env: Env,
): Promise<void> {
  const body = message.body;
  if (!body || typeof body.jobId !== "string") {
    message.ack();
    return;
  }

  const stageRun = await fetchStageRunById(env.PIPELINE_DB, body.jobId);
  if (!stageRun) {
    message.ack();
    return;
  }
  if (stageRun.status === "succeeded" || stageRun.status === "failed") {
    message.ack();
    return;
  }
  const now = nowIso();
  if (
    stageRun.status === "running" &&
    !isRunningStale(stageRun.started_at, now, RUNNING_STALE_MINUTES)
  ) {
    message.ack();
    return;
  }

  const input = resolveStageMInput(stageRun.input_json, body);

  if (!input) {
    await completeStageRun(
      env.PIPELINE_DB,
      stageRun,
      "failed",
      null,
      buildRunnerError("Missing Stage M input.", "input_missing"),
      null,
      now,
    );
    message.ack();
    return;
  }

  await markStageRunRunning(env.PIPELINE_DB, stageRun, now);

  const targetUrl = resolveCaptureUrl(input);
  if (!targetUrl) {
    await completeStageRun(
      env.PIPELINE_DB,
      stageRun,
      "failed",
      null,
      buildRunnerError("Missing capture URL for job.", "capture_url_missing"),
      null,
      now,
    );
    message.ack();
    return;
  }

  let htmlResult: { html: string; sourceUrl: string };
  try {
    htmlResult = await fetchHtmlSnapshot(targetUrl, env);
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Capture failed.";
    const isAbort = error instanceof Error && error.name === "AbortError";
    await completeStageRun(
      env.PIPELINE_DB,
      stageRun,
      "failed",
      null,
      buildRunnerError(
        isAbort ? "Capture timed out." : messageText,
        isAbort ? "capture_timeout" : "capture_failed",
        { url: targetUrl },
      ),
      null,
      now,
    );
    message.ack();
    return;
  }

  const output = buildStageMOutputFromHtml(
    input,
    htmlResult.html,
    htmlResult.sourceUrl,
  );

  if (!output) {
    await completeStageRun(
      env.PIPELINE_DB,
      stageRun,
      "failed",
      null,
      buildRunnerError("No parseable data found.", "parse_failed"),
      null,
      now,
    );
    message.ack();
    return;
  }

  let artifact = null;
  if (stageRun.candidate_id) {
    try {
      artifact = await storeHtmlArtifact(
        env.PIPELINE_EVIDENCE,
        stageRun.candidate_id,
        stageRun.id,
        htmlResult.html,
        DEFAULT_ARTIFACT_KIND,
        now,
      );
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Artifact storage failed.";
      await completeStageRun(
        env.PIPELINE_DB,
        stageRun,
        "failed",
        null,
        buildRunnerError(messageText, "artifact_store_failed"),
        null,
        now,
      );
      message.ack();
      return;
    }
  }

  await completeStageRun(
    env.PIPELINE_DB,
    stageRun,
    "succeeded",
    output,
    null,
    artifact,
    now,
  );
  message.ack();
}

const queueWorker = {
  async queue(
    batch: MessageBatch<StageMQueueMessage>,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    for (const message of batch.messages) {
      ctx.waitUntil(
        handleQueueMessage(message, env).catch((error) => {
          console.error("Queue worker failed.", error);
          message.retry();
        }),
      );
    }
  },
};

export default queueWorker;
