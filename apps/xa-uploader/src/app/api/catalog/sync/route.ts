/* eslint-disable security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] temp paths derived from validated inputs */
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { toPositiveInt } from "@acme/lib";
import {
  type CatalogProductDraftInput,
  getCatalogDraftWorkflowReadiness,
  slugify,
} from "@acme/lib/xa";

import {
  type CatalogPublishError,
  getCatalogContractReadiness,
  publishCatalogArtifactsToContract,
  publishCatalogPayloadToContract,
} from "../../../../lib/catalogContractClient";
import { resolveXaUploaderProductsCsvPath } from "../../../../lib/catalogCsv";
import {
  readCloudDraftSnapshot,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { buildCatalogArtifactsFromDrafts } from "../../../../lib/catalogDraftToContract";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import { getCatalogSyncInputStatus } from "../../../../lib/catalogSyncInput";
import { isLocalFsRuntimeEnabled } from "../../../../lib/localFsGuard";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { resolveRepoRoot } from "../../../../lib/repoRoot";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import {
  acquireSyncMutex,
  getUploaderKv,
  releaseSyncMutex,
  type UploaderKvNamespace,
} from "../../../../lib/syncMutex";
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

type DeployTriggerStatus = "triggered" | "skipped_unconfigured" | "skipped_cooldown" | "failed";

type DeployTriggerResult = {
  status: DeployTriggerStatus;
  nextEligibleAt?: string;
  reason?: string;
  httpStatus?: number;
};

const SYNC_WINDOW_MS = 60 * 1000;
const SYNC_MAX_REQUESTS = 3;
const SYNC_READINESS_WINDOW_MS = 60 * 1000;
const SYNC_READINESS_MAX_REQUESTS = 30;
const SYNC_PAYLOAD_MAX_BYTES = 24 * 1024;
const SYNC_LOG_MAX_BYTES_DEFAULT = 128 * 1024;
const SYNC_PUBLISH_HISTORY_MAX = 100;
const DEPLOY_HOOK_TIMEOUT_MS_DEFAULT = 15_000;
const DEPLOY_HOOK_COOLDOWN_SECONDS_DEFAULT = 900;

function buildDisplaySyncGuidance(deploy?: DeployTriggerResult) {
  if (deploy?.status === "triggered") {
    return {
      mode: "build_time_runtime_catalog",
      requiresXaBBuild: false,
      nextAction: "await_xa_b_deploy",
      deployStatus: deploy.status,
      nextEligibleAt: deploy.nextEligibleAt,
    };
  }
  if (deploy?.status === "skipped_cooldown") {
    return {
      mode: "build_time_runtime_catalog",
      requiresXaBBuild: true,
      nextAction: "wait_or_manual_deploy_xa_b",
      deployStatus: deploy.status,
      nextEligibleAt: deploy.nextEligibleAt,
    };
  }
  if (deploy?.status === "failed") {
    return {
      mode: "build_time_runtime_catalog",
      requiresXaBBuild: true,
      nextAction: "manual_rebuild_and_deploy_xa_b",
      deployStatus: deploy.status,
      nextEligibleAt: deploy.nextEligibleAt,
      deployReason: deploy.reason,
    };
  }
  return {
    mode: "build_time_runtime_catalog",
    requiresXaBBuild: true,
    nextAction: "rebuild_and_deploy_xa_b",
    ...(deploy ? { deployStatus: deploy.status } : {}),
    ...(deploy?.nextEligibleAt ? { nextEligibleAt: deploy.nextEligibleAt } : {}),
  };
}

function getValidateTimeoutMs(): number {
  return toPositiveInt(process.env.XA_UPLOADER_SYNC_VALIDATE_TIMEOUT_MS, 45_000, 1);
}

function getSyncTimeoutMs(): number {
  return toPositiveInt(process.env.XA_UPLOADER_SYNC_TIMEOUT_MS, 300_000, 1);
}

function getSyncLogMaxBytes(): number {
  return toPositiveInt(process.env.XA_UPLOADER_SYNC_LOG_MAX_BYTES, SYNC_LOG_MAX_BYTES_DEFAULT, 1);
}

function getDeployHookUrl(): string {
  return (process.env.XA_B_DEPLOY_HOOK_URL ?? "").trim();
}

function getDeployHookTimeoutMs(): number {
  return toPositiveInt(
    process.env.XA_B_DEPLOY_HOOK_TIMEOUT_MS,
    DEPLOY_HOOK_TIMEOUT_MS_DEFAULT,
    1,
  );
}

function getDeployHookCooldownSeconds(): number {
  return toPositiveInt(
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS,
    DEPLOY_HOOK_COOLDOWN_SECONDS_DEFAULT,
    1,
  );
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

function normalizePublishState(product: CatalogProductDraftInput): "draft" | "ready" | "live" {
  if (product.publishState === "draft" || product.publishState === "ready" || product.publishState === "live") {
    return product.publishState;
  }
  const readiness = getCatalogDraftWorkflowReadiness(product);
  return readiness.isPublishReady ? "live" : "draft";
}

function productIdentity(product: CatalogProductDraftInput): string {
  const id = (product.id ?? "").trim();
  if (id) return `id:${id}`;
  return `slug:${slugify(product.slug || product.title)}`;
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

function buildCatalogInputGuardResponse(params: {
  inputStatus: Awaited<ReturnType<typeof getCatalogSyncInputStatus>>;
  confirmEmptyInput: boolean;
  inputPath: string;
  startedAt: number;
}): NextResponse | null {
  const { inputStatus, confirmEmptyInput, inputPath, startedAt } = params;
  if (!inputStatus.exists) {
    return NextResponse.json(
      {
        ok: false,
        error: "catalog_input_missing",
        recovery: "create_catalog_input",
        input: {
          exists: false,
          rowCount: 0,
          path: inputPath,
        },
        durationMs: Date.now() - startedAt,
      },
      { status: 409 },
    );
  }

  if (inputStatus.rowCount === 0 && !confirmEmptyInput) {
    return NextResponse.json(
      {
        ok: false,
        error: "catalog_input_empty",
        recovery: "confirm_empty_catalog_sync",
        requiresConfirmation: true,
        input: {
          exists: inputStatus.exists,
          rowCount: inputStatus.rowCount,
          path: inputPath,
        },
        durationMs: Date.now() - startedAt,
      },
      { status: 409 },
    );
  }

  return null;
}

function getDeployCooldownKey(storefrontId: XaCatalogStorefront): string {
  return `xa-deploy-cooldown:${storefrontId}`;
}

function getDeployCooldownStatePath(uploaderDataDir: string, storefrontId: XaCatalogStorefront): string {
  return path.join(uploaderDataDir, "deploy-cooldown", `${storefrontId}.json`);
}

function parseNextEligibleAt(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { nextEligibleAt?: string };
    if (typeof parsed.nextEligibleAt !== "string") return null;
    const epochMs = Date.parse(parsed.nextEligibleAt);
    if (!Number.isFinite(epochMs)) return null;
    return epochMs;
  } catch {
    return null;
  }
}

async function readDeployCooldownEpochMs(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePath?: string;
}): Promise<number | null> {
  if (params.kv) {
    const raw = await params.kv.get(getDeployCooldownKey(params.storefrontId));
    return parseNextEligibleAt(raw);
  }
  if (!params.statePath) return null;
  try {
    const raw = await fs.readFile(params.statePath, "utf8");
    return parseNextEligibleAt(raw);
  } catch {
    return null;
  }
}

async function writeDeployCooldown(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  cooldownSeconds: number;
  nextEligibleAtMs: number;
  statePath?: string;
}): Promise<void> {
  const payload = JSON.stringify(
    {
      storefront: params.storefrontId,
      nextEligibleAt: new Date(params.nextEligibleAtMs).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  );
  if (params.kv) {
    await params.kv.put(getDeployCooldownKey(params.storefrontId), payload, {
      expirationTtl: params.cooldownSeconds,
    });
    return;
  }
  if (!params.statePath) return;
  await fs.mkdir(path.dirname(params.statePath), { recursive: true });
  await fs.writeFile(`${params.statePath}.tmp`, `${payload}\n`, "utf8");
  await fs.rename(`${params.statePath}.tmp`, params.statePath);
}

async function maybeTriggerXaBDeploy(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePath?: string;
}): Promise<DeployTriggerResult> {
  const hookUrl = getDeployHookUrl();
  if (!hookUrl) {
    return { status: "skipped_unconfigured" };
  }

  const cooldownSeconds = getDeployHookCooldownSeconds();
  const nowMs = Date.now();
  const nextEligibleAtMs = await readDeployCooldownEpochMs({
    storefrontId: params.storefrontId,
    kv: params.kv,
    statePath: params.statePath,
  }).catch(() => null);
  if (nextEligibleAtMs !== null && nextEligibleAtMs > nowMs) {
    return {
      status: "skipped_cooldown",
      nextEligibleAt: new Date(nextEligibleAtMs).toISOString(),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getDeployHookTimeoutMs());
  let response: Response;
  try {
    response = await fetch(hookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storefront: params.storefrontId,
        triggeredBy: "xa-uploader-sync",
        triggeredAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error ? error.message : String(error);
    return { status: "failed", reason: message };
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const details = bodyText.trim().slice(0, 160);
    return {
      status: "failed",
      reason: details ? `http_${response.status}:${details}` : `http_${response.status}`,
      httpStatus: response.status,
    };
  }

  const cooldownUntilMs = nowMs + cooldownSeconds * 1000;
  await writeDeployCooldown({
    storefrontId: params.storefrontId,
    kv: params.kv,
    statePath: params.statePath,
    cooldownSeconds,
    nextEligibleAtMs: cooldownUntilMs,
  }).catch(() => undefined);

  return {
    status: "triggered",
    nextEligibleAt: new Date(cooldownUntilMs).toISOString(),
  };
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

async function readGeneratedCatalogProductCount(catalogOutPath: string): Promise<number> {
  try {
    const catalogRaw = await fs.readFile(catalogOutPath, "utf8");
    const parsed = JSON.parse(catalogRaw) as { products?: unknown };
    return Array.isArray(parsed.products) ? parsed.products.length : 0;
  } catch {
    return 0;
  }
}

function buildNoPublishableProductsResponse(params: {
  inputPath: string;
  totalDraftRows: number;
  startedAt: number;
  validateResult: ScriptRunResult;
  syncResult: ScriptRunResult;
}): NextResponse {
  return NextResponse.json(
    maybeAttachLogs(
      {
        ok: false,
        error: "no_publishable_products",
        recovery: "mark_products_ready",
        requiresConfirmation: true,
        input: {
          exists: true,
          rowCount: 0,
          totalDraftRows: params.totalDraftRows,
          path: params.inputPath,
        },
        durationMs: Date.now() - params.startedAt,
      },
      { validate: params.validateResult, sync: params.syncResult },
    ),
    { status: 409 },
  );
}

async function tryPublishArtifactsToContract(params: {
  storefrontId: XaCatalogStorefront;
  catalogOutPath: string;
  mediaOutPath: string;
  publishHistoryPath: string;
  startedAt: number;
  validateResult: ScriptRunResult | null;
  syncResult: ScriptRunResult | null;
}): Promise<
  | { published: true; result: Awaited<ReturnType<typeof publishCatalogArtifactsToContract>> }
  | { published: false; skipped: true }
  | { published: false; skipped: false; errorResponse: NextResponse }
> {
  const contractReadiness = getCatalogContractReadiness();
  if (!contractReadiness.configured) {
    return { published: false, skipped: true };
  }
  try {
    const publishResult = await publishCatalogArtifactsToContract({
      storefrontId: params.storefrontId,
      catalogOutPath: params.catalogOutPath,
      mediaOutPath: params.mediaOutPath,
    });
    await recordPublishHistory({
      historyPath: params.publishHistoryPath,
      storefrontId: params.storefrontId,
      catalogOutPath: params.catalogOutPath,
      mediaOutPath: params.mediaOutPath,
      publishResult: publishResult ?? {},
    });
    return { published: true, result: publishResult };
  } catch (error) {
    const publishError = getPublishErrorDetails(error);
    const isUnconfigured = publishError.code === "unconfigured";
    console.error({
      route: "POST /api/catalog/sync",
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - params.startedAt,
    });
    const failurePayload = maybeAttachLogs(
      {
        ok: false,
        error: isUnconfigured ? "catalog_publish_unconfigured" : "catalog_publish_failed",
        recovery: isUnconfigured ? "configure_catalog_contract" : "review_catalog_contract",
        durationMs: Date.now() - params.startedAt,
        publishStatus: publishError.status,
        publishDetails: shouldExposeSyncLogs() ? publishError.details : undefined,
      },
      { validate: params.validateResult, sync: params.syncResult },
    );
    return {
      published: false,
      skipped: false,
      errorResponse: NextResponse.json(failurePayload, { status: isUnconfigured ? 503 : 502 }),
    };
  }
}

async function runSyncPipeline(params: {
  repoRoot: string;
  storefrontId: XaCatalogStorefront;
  payload: SyncPayload;
  startedAt: number;
  kv: UploaderKvNamespace | null;
}): Promise<NextResponse> {
  const { repoRoot, storefrontId, payload, startedAt, kv } = params;
  const productsCsvPath = resolveXaUploaderProductsCsvPath(storefrontId);
  const uploaderDataDir = path.join(repoRoot, "apps", "xa-uploader", "data");
  const currencyRatesPath = path.join(uploaderDataDir, "currency-rates.json");
  const statePath = path.join(uploaderDataDir, `.xa-upload-state.${storefrontId}.json`);
  const backupDir = path.join(uploaderDataDir, "backups", storefrontId);
  const publishHistoryPath = getPublishHistoryPath(uploaderDataDir, storefrontId);
  const deployCooldownStatePath = getDeployCooldownStatePath(uploaderDataDir, storefrontId);
  await fs.mkdir(uploaderDataDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  const { catalogOutPath, mediaOutPath } = resolveGeneratedArtifactPaths(uploaderDataDir, storefrontId);
  await fs.mkdir(path.dirname(catalogOutPath), { recursive: true });

  const inputStatus = await getCatalogSyncInputStatus(productsCsvPath);
  const inputGuardResponse = buildCatalogInputGuardResponse({
    inputStatus,
    confirmEmptyInput: payload.options.confirmEmptyInput === true,
    inputPath: productsCsvPath,
    startedAt,
  });
  if (inputGuardResponse) {
    return inputGuardResponse;
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

  const publishableCount = await readGeneratedCatalogProductCount(catalogOutPath);
  if (publishableCount === 0 && inputStatus.rowCount > 0 && !payload.options.confirmEmptyInput) {
    return buildNoPublishableProductsResponse({
      inputPath: productsCsvPath,
      totalDraftRows: inputStatus.rowCount,
      startedAt,
      validateResult,
      syncResult,
    });
  }

  let publishResult: Awaited<ReturnType<typeof publishCatalogArtifactsToContract>> | null = null;
  let publishSkipped = false;
  let deployResult: DeployTriggerResult | undefined;
  if (!payload.options.dryRun) {
    const outcome = await tryPublishArtifactsToContract({
      storefrontId,
      catalogOutPath,
      mediaOutPath,
      publishHistoryPath,
      startedAt,
      validateResult,
      syncResult,
    });
    if ("result" in outcome) {
      publishResult = outcome.result;
    } else if ("errorResponse" in outcome) {
      return outcome.errorResponse;
    } else {
      publishSkipped = true;
    }

    if (publishResult) {
      deployResult = await maybeTriggerXaBDeploy({
        storefrontId,
        kv,
        statePath: deployCooldownStatePath,
      });
    }
  }

  return NextResponse.json(
    maybeAttachLogs(
      {
        ok: true,
        durationMs: Date.now() - startedAt,
        dryRun: Boolean(payload.options.dryRun),
        publishSkipped: publishSkipped || undefined,
        publishedVersion: publishResult?.version,
        publishedAt: publishResult?.publishedAt,
        deploy: deployResult,
        display: buildDisplaySyncGuidance(deployResult),
      },
      { validate: validateResult, sync: syncResult },
    ),
  );
}

async function runCloudSyncPipeline(params: {
  storefrontId: XaCatalogStorefront;
  payload: SyncPayload;
  startedAt: number;
  kv: UploaderKvNamespace | null;
}): Promise<NextResponse> {
  const { storefrontId, payload, startedAt, kv } = params;
  const snapshot = await readCloudDraftSnapshot(storefrontId);
  const publishableProducts = snapshot.products.filter((product) => {
    const state = normalizePublishState(product);
    return state === "ready" || state === "live";
  });

  if (publishableProducts.length === 0 && !payload.options.confirmEmptyInput) {
    return NextResponse.json(
      {
        ok: false,
        error: "no_publishable_products",
        recovery: "mark_products_ready",
        requiresConfirmation: true,
        input: {
          exists: true,
          rowCount: publishableProducts.length,
          totalDraftRows: snapshot.products.length,
          path: `cloud-draft://${storefrontId}`,
        },
        durationMs: Date.now() - startedAt,
      },
      { status: 409 },
    );
  }

  let builtArtifacts: Awaited<ReturnType<typeof buildCatalogArtifactsFromDrafts>>;
  try {
    builtArtifacts = await buildCatalogArtifactsFromDrafts({
      storefront: storefrontId,
      products: publishableProducts,
      strict: payload.options.strict === true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation_failed",
        recovery: "review_validation_logs",
        durationMs: Date.now() - startedAt,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 },
    );
  }
  const { catalog, mediaIndex } = builtArtifacts;
  const warnings = [...builtArtifacts.warnings];

  let publishResult: { version?: string; publishedAt?: string } | null = null;
  let publishSkipped = false;
  let deployResult: DeployTriggerResult | undefined;
  if (!payload.options.dryRun) {
    const contractReadiness = getCatalogContractReadiness();
    if (!contractReadiness.configured) {
      publishSkipped = true;
    } else {
      try {
        publishResult = await publishCatalogPayloadToContract({
          storefrontId,
          payload: {
            storefront: storefrontId,
            publishedAt: new Date().toISOString(),
            catalog,
            mediaIndex,
          },
        });
      } catch (error) {
        const publishError = getPublishErrorDetails(error);
        const isUnconfigured = publishError.code === "unconfigured";
        console.error({
          route: "POST /api/catalog/sync",
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - startedAt,
        });
        return NextResponse.json(
          {
            ok: false,
            error: isUnconfigured ? "catalog_publish_unconfigured" : "catalog_publish_failed",
            recovery: isUnconfigured ? "configure_catalog_contract" : "review_catalog_contract",
            durationMs: Date.now() - startedAt,
            publishStatus: publishError.status,
          },
          { status: isUnconfigured ? 503 : 502 },
        );
      }
    }

    if (!publishSkipped) {
      const promotedIds = new Set(publishableProducts.map(productIdentity));
      const promotedProducts = snapshot.products.map((product) => {
        if (promotedIds.has(productIdentity(product))) {
          return { ...product, publishState: "live" as const };
        }
        return { ...product, publishState: normalizePublishState(product) };
      });

      try {
        await writeCloudDraftSnapshot({
          storefront: storefrontId,
          products: promotedProducts,
          revisionsById: snapshot.revisionsById,
          ifMatchDocRevision: snapshot.docRevision,
        });
      } catch {
        warnings.push("publish_state_promotion_failed");
      }

      deployResult = await maybeTriggerXaBDeploy({
        storefrontId,
        kv,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    dryRun: Boolean(payload.options.dryRun),
    mode: "cloud",
    publishSkipped: publishSkipped || undefined,
    publishedVersion: publishResult?.version,
    publishedAt: publishResult?.publishedAt,
    deploy: deployResult,
    warnings,
    counts: {
      products: catalog.products.length,
      media: mediaIndex.totals.media,
    },
    display: buildDisplaySyncGuidance(deployResult),
  });
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

  // Best-effort concurrency guard: concurrent sync invocations for the same storefront
  // return 409 when the KV lock key is present. KV unavailability is fail-open — a KV
  // outage must not block all sync operations. See syncMutex.ts for full rationale.
  const kv = await getUploaderKv();
  let mutexAcquired = false;
  if (kv) {
    try {
      const acquired = await acquireSyncMutex(kv, storefrontId);
      if (!acquired) {
        return withRateHeaders(
          NextResponse.json(
            { ok: false, error: "conflict", reason: "sync_already_running" },
            { status: 409 },
          ),
          limit,
        ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
      }
      mutexAcquired = true;
    } catch {
      // KV acquire failed — fail open. Log warning; sync proceeds without mutex.
      console.warn({
        route: "POST /api/catalog/sync",
        warning: "mutex_acquire_failed_kv_unavailable",
      });
    }
  }

  let response: NextResponse;
  try {
    response = isLocalFsRuntimeEnabled()
      ? await runSyncPipeline({
          repoRoot,
          storefrontId,
          payload,
          startedAt,
          kv,
        })
      : await runCloudSyncPipeline({
          storefrontId,
          payload,
          startedAt,
          kv,
        });
  } finally {
    if (kv && mutexAcquired) {
      try {
        await releaseSyncMutex(kv, storefrontId);
      } catch {
        // Release failure is non-fatal — TTL will self-expire in 5 minutes.
      }
    }
  }
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
  if (!isLocalFsRuntimeEnabled()) {
    const contractReadiness = getCatalogContractReadiness();
    return withRateHeaders(
      NextResponse.json({
        ok: true,
        ready: contractReadiness.configured,
        missingScripts: [],
        contractConfigured: contractReadiness.configured,
        contractConfigErrors: contractReadiness.errors,
        mode: "cloud",
        recovery: contractReadiness.configured ? undefined : "configure_catalog_contract",
        checkedAt: new Date().toISOString(),
      }),
      limit,
    );
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
      ready: syncReadiness.ready,
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
