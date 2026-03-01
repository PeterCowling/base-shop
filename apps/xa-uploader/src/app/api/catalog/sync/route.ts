/* eslint-disable security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] temp paths derived from validated inputs */
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { toPositiveInt } from "@acme/lib";

import {
  type CatalogPublishError,
  getCatalogContractReadiness,
  publishCatalogArtifactsToContract,
} from "../../../../lib/catalogContractClient";
import { resolveXaUploaderProductsCsvPath } from "../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import { getCatalogSyncInputStatus } from "../../../../lib/catalogSyncInput";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { resolveRepoRoot } from "../../../../lib/repoRoot";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type SyncOptions = {
  strict?: boolean;
  dryRun?: boolean;
  replace?: boolean;
  recursive?: boolean;
  confirmEmptyInput?: boolean;
};

type SyncPayload = {
  options: SyncOptions;
  storefront: string | null;
};

type SyncScriptId = "validate" | "sync";
type CurrencyRates = { EUR: number; GBP: number; AUD: number };

type ScriptRunResult = {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

const SYNC_WINDOW_MS = 60 * 1000;
const SYNC_MAX_REQUESTS = 3;
const SYNC_READINESS_WINDOW_MS = 60 * 1000;
const SYNC_READINESS_MAX_REQUESTS = 30;
const SYNC_PAYLOAD_MAX_BYTES = 24 * 1024;
const SYNC_LOG_MAX_BYTES_DEFAULT = 128 * 1024;
const SYNC_PUBLISH_HISTORY_MAX = 100;

function getValidateTimeoutMs(): number {
  return toPositiveInt(process.env.XA_UPLOADER_SYNC_VALIDATE_TIMEOUT_MS, 45_000, 1);
}

function getSyncTimeoutMs(): number {
  return toPositiveInt(process.env.XA_UPLOADER_SYNC_TIMEOUT_MS, 300_000, 1);
}

function getSyncLogMaxBytes(): number {
  return toPositiveInt(process.env.XA_UPLOADER_SYNC_LOG_MAX_BYTES, SYNC_LOG_MAX_BYTES_DEFAULT, 1);
}

function shouldExposeSyncLogs(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.XA_UPLOADER_EXPOSE_SYNC_LOGS === "1";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseSyncOptions(input: unknown): SyncOptions {
  if (!isRecord(input)) return {};

  return {
    strict: input.strict === true,
    dryRun: input.dryRun === true,
    replace: input.replace === true,
    recursive: input.recursive === true,
    confirmEmptyInput: input.confirmEmptyInput === true,
  };
}

async function parseSyncPayload(request: Request): Promise<SyncPayload> {
  const payload = await readJsonBodyWithLimit(request, SYNC_PAYLOAD_MAX_BYTES);
  const options = isRecord(payload) ? parseSyncOptions(payload.options) : {};
  const storefront =
    isRecord(payload) && typeof payload.storefront === "string" ? payload.storefront : null;
  return { options, storefront };
}

function getPayloadParseErrorResponse(error: unknown): NextResponse {
  if (error instanceof PayloadTooLargeError) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large", reason: "payload_too_large" },
      { status: 413 },
    );
  }
  if (error instanceof InvalidJsonError) {
    return NextResponse.json(
      { ok: false, error: "invalid", reason: "invalid_json" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: false, error: "invalid", reason: "invalid_json" }, { status: 400 });
}

async function findMissingSyncScripts(
  scripts: Array<{ id: SyncScriptId; scriptPath: string }>,
): Promise<SyncScriptId[]> {
  const missing: SyncScriptId[] = [];
  for (const script of scripts) {
    try {
      await fs.access(script.scriptPath, fsConstants.F_OK);
    } catch {
      missing.push(script.id);
    }
  }
  return missing;
}

function getSyncScripts(repoRoot: string): Array<{ id: SyncScriptId; scriptPath: string }> {
  return [
    { id: "validate", scriptPath: path.join(repoRoot, "scripts", "src", "xa", "validate-xa-inputs.ts") },
    { id: "sync", scriptPath: path.join(repoRoot, "scripts", "src", "xa", "run-xa-pipeline.ts") },
  ];
}

async function getSyncReadiness(repoRoot: string): Promise<{
  ready: boolean;
  missingScripts: SyncScriptId[];
  scripts: Array<{ id: SyncScriptId; scriptPath: string }>;
}> {
  const scripts = getSyncScripts(repoRoot);
  const missingScripts = await findMissingSyncScripts(scripts);
  return {
    ready: missingScripts.length === 0,
    missingScripts,
    scripts,
  };
}

function buildValidateArgs(productsCsvPath: string, options: SyncOptions): string[] {
  const args = ["--products", productsCsvPath];
  if (options.recursive) args.push("--recursive");
  if (options.strict) args.push("--strict");
  return args;
}

function buildSyncArgs(paths: {
  productsCsvPath: string;
  catalogOutPath: string;
  mediaOutPath: string;
  statePath: string;
  backupDir: string;
  options: SyncOptions;
  currencyRatesPath?: string;
}): string[] {
  const args = [
    "--products",
    paths.productsCsvPath,
    "--simple",
    "--out",
    paths.catalogOutPath,
    "--media-out",
    paths.mediaOutPath,
    "--state",
    paths.statePath,
    "--backup",
    "--backup-dir",
    paths.backupDir,
  ];
  if (paths.options.replace) args.push("--replace");
  if (paths.options.recursive) args.push("--recursive");
  if (paths.options.dryRun) args.push("--dry-run");
  if (paths.options.strict) args.push("--strict");
  if (paths.currencyRatesPath) {
    args.push("--currency-rates", paths.currencyRatesPath);
  }
  return args;
}

async function runNodeTsx(
  repoRoot: string,
  scriptPath: string,
  args: string[],
  timeoutMs: number,
): Promise<ScriptRunResult> {
  return await new Promise<ScriptRunResult>((resolve) => {
    const logMaxBytes = getSyncLogMaxBytes();

    const appendChunk = (
      chunks: Buffer[],
      chunk: Buffer,
      state: { bytes: number },
    ): void => {
      if (state.bytes >= logMaxBytes) return;
      const remaining = logMaxBytes - state.bytes;
      const next = chunk.byteLength <= remaining ? chunk : chunk.subarray(0, remaining);
      chunks.push(next);
      state.bytes += next.byteLength;
    };

    const child = spawn(process.execPath, ["--import", "tsx", scriptPath, ...args], {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const stdoutState = { bytes: 0 };
    const stderrState = { bytes: 0 };
    let timedOut = false;

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => appendChunk(stdoutChunks, chunk, stdoutState));
    child.stderr.on("data", (chunk: Buffer) => appendChunk(stderrChunks, chunk, stderrState));
    child.on("close", (code) => {
      clearTimeout(timeoutHandle);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      resolve({
        code: timedOut ? 124 : (code ?? 1),
        stdout,
        stderr,
        timedOut,
      });
    });
  });
}

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

function maybeAttachLogs<T extends Record<string, unknown>>(
  payload: T,
  logs: { validate: ScriptRunResult; sync?: ScriptRunResult },
): T & { logs?: { validate: ScriptRunResult; sync?: ScriptRunResult } } {
  if (!shouldExposeSyncLogs()) return payload;
  return { ...payload, logs };
}

function resolveGeneratedArtifactPaths(
  uploaderDataDir: string,
  storefrontId: XaCatalogStorefront,
): { catalogOutPath: string; mediaOutPath: string } {
  const generatedDir = path.join(uploaderDataDir, "sync-artifacts", storefrontId);
  return {
    catalogOutPath: path.join(generatedDir, "catalog.json"),
    mediaOutPath: path.join(generatedDir, "catalog.media.json"),
  };
}

function getPublishHistoryPath(uploaderDataDir: string, storefrontId: XaCatalogStorefront): string {
  return path.join(uploaderDataDir, "publish-history", `${storefrontId}.json`);
}

function getPublishHistoryMaxEntries(): number {
  return toPositiveInt(process.env.XA_UPLOADER_PUBLISH_HISTORY_MAX, SYNC_PUBLISH_HISTORY_MAX, 1);
}

function validateCurrencyRates(value: unknown): value is CurrencyRates {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const rates = [record.EUR, record.GBP, record.AUD];
  return rates.every((rate) => typeof rate === "number" && Number.isFinite(rate) && rate > 0);
}

async function getCurrencyRatesStatus(currencyRatesPath: string): Promise<{
  ok: true;
} | {
  ok: false;
  reason: "currency_rates_missing" | "currency_rates_invalid";
}> {
  try {
    const raw = await fs.readFile(currencyRatesPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!validateCurrencyRates(parsed)) {
      return { ok: false, reason: "currency_rates_invalid" };
    }
    return { ok: true };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return { ok: false, reason: "currency_rates_missing" };
    return { ok: false, reason: "currency_rates_invalid" };
  }
}

async function recordPublishHistory(params: {
  historyPath: string;
  storefrontId: XaCatalogStorefront;
  catalogOutPath: string;
  mediaOutPath: string;
  publishResult: { version?: string; publishedAt?: string };
}): Promise<void> {
  const entry = {
    storefront: params.storefrontId,
    version: params.publishResult.version,
    publishedAt: params.publishResult.publishedAt,
    recordedAt: new Date().toISOString(),
    catalogOutPath: params.catalogOutPath,
    mediaOutPath: params.mediaOutPath,
  };
  const maxEntries = getPublishHistoryMaxEntries();

  let existing: { entries?: unknown } = {};
  try {
    existing = JSON.parse(await fs.readFile(params.historyPath, "utf8")) as { entries?: unknown };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw error;
    }
  }

  const previousEntries = Array.isArray(existing.entries) ? existing.entries : [];
  const entries = [...previousEntries, entry].slice(-maxEntries);
  await fs.mkdir(path.dirname(params.historyPath), { recursive: true });
  await fs.writeFile(
    `${params.historyPath}.tmp`,
    `${JSON.stringify(
      {
        storefront: params.storefrontId,
        updatedAt: new Date().toISOString(),
        entries,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await fs.rename(`${params.historyPath}.tmp`, params.historyPath);
}

function getPublishErrorDetails(error: unknown): {
  code: string;
  status?: number;
  details?: string;
} {
  const publishError = error as Partial<CatalogPublishError>;
  return {
    code: typeof publishError?.code === "string" ? publishError.code : "request_failed",
    status: typeof publishError?.status === "number" ? publishError.status : undefined,
    details: typeof publishError?.details === "string" ? publishError.details : undefined,
  };
}

async function runSyncPipeline(params: {
  repoRoot: string;
  storefrontId: XaCatalogStorefront;
  payload: SyncPayload;
  startedAt: number;
}): Promise<NextResponse> {
  const { repoRoot, storefrontId, payload, startedAt } = params;
  const productsCsvPath = resolveXaUploaderProductsCsvPath(storefrontId);
  const uploaderDataDir = path.join(repoRoot, "apps", "xa-uploader", "data");
  const currencyRatesPath = path.join(uploaderDataDir, "currency-rates.json");
  const statePath = path.join(uploaderDataDir, `.xa-upload-state.${storefrontId}.json`);
  const backupDir = path.join(uploaderDataDir, "backups", storefrontId);
  const publishHistoryPath = getPublishHistoryPath(uploaderDataDir, storefrontId);
  await fs.mkdir(uploaderDataDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  const { catalogOutPath, mediaOutPath } = resolveGeneratedArtifactPaths(uploaderDataDir, storefrontId);
  await fs.mkdir(path.dirname(catalogOutPath), { recursive: true });

  const inputStatus = await getCatalogSyncInputStatus(productsCsvPath);
  if (!inputStatus.exists) {
    return NextResponse.json(
      {
        ok: false,
        error: "catalog_input_missing",
        recovery: "create_catalog_input",
        input: {
          exists: false,
          rowCount: 0,
          path: productsCsvPath,
        },
        durationMs: Date.now() - startedAt,
      },
      { status: 409 },
    );
  }
  if (inputStatus.rowCount === 0 && !payload.options.confirmEmptyInput) {
    return NextResponse.json(
      {
        ok: false,
        error: "catalog_input_empty",
        recovery: "confirm_empty_catalog_sync",
        requiresConfirmation: true,
        input: {
          exists: inputStatus.exists,
          rowCount: inputStatus.rowCount,
          path: productsCsvPath,
        },
        durationMs: Date.now() - startedAt,
      },
      { status: 409 },
    );
  }

  const currencyRatesStatus = await getCurrencyRatesStatus(currencyRatesPath);
  if ("reason" in currencyRatesStatus) {
    return NextResponse.json(
      {
        ok: false,
        error: currencyRatesStatus.reason,
        recovery: "save_currency_rates",
        currencyRatesPath,
        durationMs: Date.now() - startedAt,
      },
      { status: 409 },
    );
  }

  const syncReadiness = await getSyncReadiness(repoRoot);
  if (!syncReadiness.ready) {
    return NextResponse.json(
      {
        ok: false,
        error: "sync_dependencies_missing",
        recovery: "restore_sync_scripts",
        missingScripts: syncReadiness.missingScripts,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }

  const scriptPaths = Object.fromEntries(syncReadiness.scripts.map((script) => [script.id, script.scriptPath])) as {
    validate: string;
    sync: string;
  };
  const validateArgs = buildValidateArgs(productsCsvPath, payload.options);
  const syncArgs = buildSyncArgs({
    productsCsvPath,
    catalogOutPath,
    mediaOutPath,
    statePath,
    backupDir,
    options: payload.options,
    currencyRatesPath,
  });

  const validateResult = await runNodeTsx(
    repoRoot,
    scriptPaths.validate,
    validateArgs,
    getValidateTimeoutMs(),
  );
  if (validateResult.code !== 0) {
    return NextResponse.json(
      maybeAttachLogs(
        {
          ok: false,
          error: "validation_failed",
          recovery: "review_validation_logs",
          durationMs: Date.now() - startedAt,
          timedOut: validateResult.timedOut,
        },
        { validate: validateResult },
      ),
      { status: 400 },
    );
  }

  const syncResult = await runNodeTsx(repoRoot, scriptPaths.sync, syncArgs, getSyncTimeoutMs());
  if (syncResult.code !== 0) {
    return NextResponse.json(
      maybeAttachLogs(
        {
          ok: false,
          error: "sync_failed",
          recovery: "review_sync_logs",
          durationMs: Date.now() - startedAt,
          timedOut: syncResult.timedOut,
        },
        { validate: validateResult, sync: syncResult },
      ),
      { status: 400 },
    );
  }

  let publishResult: Awaited<ReturnType<typeof publishCatalogArtifactsToContract>> | null = null;
  if (!payload.options.dryRun) {
    try {
      publishResult = await publishCatalogArtifactsToContract({
        storefrontId,
        catalogOutPath,
        mediaOutPath,
      });
      await recordPublishHistory({
        historyPath: publishHistoryPath,
        storefrontId,
        catalogOutPath,
        mediaOutPath,
        publishResult: publishResult ?? {},
      });
    } catch (error) {
      const publishError = getPublishErrorDetails(error);
      const isUnconfigured = publishError.code === "unconfigured";
      const failurePayload = maybeAttachLogs(
        {
          ok: false,
          error: isUnconfigured ? "catalog_publish_unconfigured" : "catalog_publish_failed",
          recovery: isUnconfigured ? "configure_catalog_contract" : "review_catalog_contract",
          durationMs: Date.now() - startedAt,
          publishStatus: publishError.status,
          publishDetails: shouldExposeSyncLogs() ? publishError.details : undefined,
        },
        { validate: validateResult, sync: syncResult },
      );
      return NextResponse.json(failurePayload, { status: isUnconfigured ? 503 : 502 });
    }
  }

  return NextResponse.json(
    maybeAttachLogs(
      {
        ok: true,
        durationMs: Date.now() - startedAt,
        dryRun: Boolean(payload.options.dryRun),
        publishedVersion: publishResult?.version,
        publishedAt: publishResult?.publishedAt,
      },
      { validate: validateResult, sync: syncResult },
    ),
  );
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-sync:${requestIp}`,
    windowMs: SYNC_WINDOW_MS,
    max: SYNC_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "rate_limited", reason: "sync_rate_limited" }, { status: 429 }),
      limit,
    );
  }

  if (process.env.XA_UPLOADER_MODE === "vendor") {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  const payloadRequest = request.clone();
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  let payload: SyncPayload = { options: {}, storefront: null };
  try {
    payload = await parseSyncPayload(payloadRequest);
  } catch (error) {
    return withRateHeaders(getPayloadParseErrorResponse(error), limit);
  }

  const startedAt = Date.now();
  const repoRoot = resolveRepoRoot();

  const storefrontId = parseStorefront(payload.storefront);
  const response = await runSyncPipeline({
    repoRoot,
    storefrontId,
    payload,
    startedAt,
  });
  return withRateHeaders(response, limit);
}

export async function GET(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-sync-readiness:${requestIp}`,
    windowMs: SYNC_READINESS_WINDOW_MS,
    max: SYNC_READINESS_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "rate_limited", reason: "sync_readiness_rate_limited" }, { status: 429 }),
      limit,
    );
  }

  if (process.env.XA_UPLOADER_MODE === "vendor") {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  const repoRoot = resolveRepoRoot();
  const storefront = new URL(request.url).searchParams.get("storefront");
  const storefrontId = parseStorefront(storefront);
  const syncReadiness = await getSyncReadiness(repoRoot);
  const contractReadiness = getCatalogContractReadiness();

  return withRateHeaders(
    NextResponse.json({
      ok: true,
      storefront: storefrontId,
      ready: syncReadiness.ready && contractReadiness.configured,
      missingScripts: syncReadiness.missingScripts,
      contractConfigured: contractReadiness.configured,
      contractConfigErrors: contractReadiness.errors,
      recovery: !syncReadiness.ready
        ? "restore_sync_scripts"
        : !contractReadiness.configured
          ? "configure_catalog_contract"
          : undefined,
      checkedAt: new Date().toISOString(),
    }),
    limit,
  );
}
