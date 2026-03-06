/* eslint-disable security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] temp paths derived from validated inputs */
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { toPositiveInt } from "@acme/lib";
import {
  type CatalogProductDraftInput,
  type CatalogPublishState,
  deriveCatalogPublishState,
  isCatalogPublishableState,
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
  acquireCloudSyncLock,
  type CloudSyncLockLease,
  readCloudDraftSnapshot,
  releaseCloudSyncLock,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { buildCatalogArtifactsFromDrafts } from "../../../../lib/catalogDraftToContract";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import { getCatalogSyncInputStatus } from "../../../../lib/catalogSyncInput";
import {
  buildDisplaySyncGuidance,
  type DeployPendingState,
  type DeployTriggerResult,
  isDeployHookConfigured,
  isDeployHookRequired,
  maybeTriggerXaBDeploy,
  reconcileDeployPendingState,
  resolveDeployStatePaths,
} from "../../../../lib/deployHook";
import { isLocalFsRuntimeEnabled } from "../../../../lib/localFsGuard";
import { getMediaBucket } from "../../../../lib/r2Media";
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
  mediaValidationPolicy?: MediaValidationPolicy;
};

type MediaValidationPolicy = "warn" | "strict";

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
const CLOUD_MEDIA_HEAD_MAX_KEYS_DEFAULT = 300;

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

  const mediaValidationPolicyRaw =
    typeof input.mediaValidationPolicy === "string"
      ? input.mediaValidationPolicy.trim().toLowerCase()
      : "";
  const mediaValidationPolicy: MediaValidationPolicy | undefined =
    mediaValidationPolicyRaw === "strict" || mediaValidationPolicyRaw === "warn"
      ? mediaValidationPolicyRaw
      : undefined;

  return {
    strict: input.strict === true,
    dryRun: input.dryRun === true,
    replace: input.replace === true,
    recursive: input.recursive === true,
    confirmEmptyInput: input.confirmEmptyInput === true,
    mediaValidationPolicy,
  };
}

function getDefaultCloudMediaValidationPolicy(): MediaValidationPolicy {
  const raw = (process.env.XA_UPLOADER_CLOUD_MEDIA_VALIDATION_POLICY ?? "warn")
    .trim()
    .toLowerCase();
  return raw === "strict" ? "strict" : "warn";
}

function resolveCloudMediaValidationPolicy(options: SyncOptions): MediaValidationPolicy {
  return options.mediaValidationPolicy ?? getDefaultCloudMediaValidationPolicy();
}

function getCloudMediaHeadMaxKeys(): number {
  return toPositiveInt(process.env.XA_UPLOADER_CLOUD_MEDIA_HEAD_MAX_KEYS, CLOUD_MEDIA_HEAD_MAX_KEYS_DEFAULT, 1);
}

function getCloudAllowedExternalImageHosts(): string[] {
  return (process.env.XA_UPLOADER_CLOUD_MEDIA_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
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

async function runOptionalPreValidation(params: {
  strict: boolean;
  repoRoot: string;
  validateScriptPath: string;
  validateArgs: string[];
  startedAt: number;
}): Promise<{ validateResult: ScriptRunResult; errorResponse: NextResponse | null }> {
  if (!params.strict) {
    return {
      validateResult: {
        code: 0,
        // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] non-UI diagnostic marker in sync logs
        stdout: "[xa-validate] skipped (strict=false)",
        stderr: "",
        timedOut: false,
      },
      errorResponse: null,
    };
  }

  const validateResult = await runNodeTsx(
    params.repoRoot,
    params.validateScriptPath,
    params.validateArgs,
    getValidateTimeoutMs(),
  );
  if (validateResult.code !== 0) {
    return {
      validateResult,
      errorResponse: NextResponse.json(
        maybeAttachLogs(
          {
            ok: false,
            error: "validation_failed",
            recovery: "review_validation_logs",
            durationMs: Date.now() - params.startedAt,
            timedOut: validateResult.timedOut,
          },
          { validate: validateResult },
        ),
        { status: 400 },
      ),
    };
  }

  return {
    validateResult,
    errorResponse: null,
  };
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

function normalizePublishState(product: CatalogProductDraftInput): CatalogPublishState {
  return deriveCatalogPublishState(product);
}

function productIdentity(product: CatalogProductDraftInput): string {
  const id = (product.id ?? "").trim();
  if (id) return `id:${id}`;
  return `slug:${slugify(product.slug || product.title)}`;
}

type CloudBuiltArtifacts = Awaited<ReturnType<typeof buildCatalogArtifactsFromDrafts>>;

function isAbsoluteHttpUrl(pathValue: string): boolean {
  return /^https?:\/\//i.test(pathValue);
}

function summarizePathsForError(paths: string[]): string {
  const MAX = 10;
  const listed = paths.slice(0, MAX).join(", ");
  if (paths.length <= MAX) return listed;
  return `${listed} (+${paths.length - MAX} more)`;
}

function pruneArtifactsByMissingKeys(params: {
  artifacts: CloudBuiltArtifacts;
  missingKeys: Set<string>;
}): CloudBuiltArtifacts {
  if (params.missingKeys.size === 0) return params.artifacts;

  const filteredProducts = params.artifacts.catalog.products.map((product) => ({
    ...product,
    media: product.media.filter((item) => {
      if (item.type !== "image") return true;
      return !params.missingKeys.has(item.path);
    }),
  }));

  const filteredMediaItems = params.artifacts.mediaIndex.items.filter(
    (item) => !params.missingKeys.has(item.catalogPath),
  );

  return {
    ...params.artifacts,
    catalog: {
      ...params.artifacts.catalog,
      products: filteredProducts,
    },
    mediaIndex: {
      ...params.artifacts.mediaIndex,
      totals: {
        ...params.artifacts.mediaIndex.totals,
        media: filteredMediaItems.length,
      },
      items: filteredMediaItems,
    },
  };
}

async function applyCloudMediaExistenceValidation(params: {
  artifacts: CloudBuiltArtifacts;
  policy: MediaValidationPolicy;
}): Promise<
  | { ok: true; artifacts: CloudBuiltArtifacts; warnings: string[] }
  | { ok: false; errorResponse: NextResponse }
> {
  const mediaKeys = Array.from(
    new Set(
      params.artifacts.mediaIndex.items
        .map((item) => item.catalogPath)
        .filter((catalogPath) => Boolean(catalogPath) && !isAbsoluteHttpUrl(catalogPath)),
    ),
  );

  if (mediaKeys.length === 0) {
    return { ok: true, artifacts: params.artifacts, warnings: [] };
  }

  const maxKeys = getCloudMediaHeadMaxKeys();
  const keysToCheck = mediaKeys.slice(0, maxKeys);
  const skippedCount = mediaKeys.length - keysToCheck.length;
  if (params.policy === "strict" && skippedCount > 0) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          ok: false,
          error: "validation_failed",
          recovery: "review_validation_logs",
          details: `cloud media validation limit exceeded (${mediaKeys.length} keys > ${maxKeys})`,
        },
        { status: 400 },
      ),
    };
  }

  const bucket = await getMediaBucket();
  if (!bucket) {
    if (params.policy === "strict") {
      return {
        ok: false,
        errorResponse: NextResponse.json(
          {
            ok: false,
            error: "validation_failed",
            recovery: "review_validation_logs",
            // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine validation details for operator logs
            details: "cloud media bucket is unavailable for strict existence validation",
          },
          { status: 400 },
        ),
      };
    }
    return {
      ok: true,
      artifacts: params.artifacts,
      warnings: skippedCount > 0 ? [`cloud_media_validation_limit_skipped:${skippedCount}`] : [],
    };
  }

  const missingKeys = new Set<string>();
  for (const key of keysToCheck) {
    try {
      const head = await bucket.head(key);
      if (!head) {
        missingKeys.add(key);
      }
    } catch {
      missingKeys.add(key);
    }
  }

  if (params.policy === "strict" && missingKeys.size > 0) {
    const sortedMissing = Array.from(missingKeys).sort((left, right) => left.localeCompare(right));
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          ok: false,
          error: "validation_failed",
          recovery: "review_validation_logs",
          details: `cloud media keys are missing: ${summarizePathsForError(sortedMissing)}`,
        },
        { status: 400 },
      ),
    };
  }

  const warnings: string[] = [];
  if (missingKeys.size > 0) {
    warnings.push(`cloud_media_missing_pruned:${missingKeys.size}`);
  }
  if (skippedCount > 0) {
    warnings.push(`cloud_media_validation_limit_skipped:${skippedCount}`);
  }

  const prunedArtifacts = pruneArtifactsByMissingKeys({
    artifacts: params.artifacts,
    missingKeys,
  });

  return {
    ok: true,
    artifacts: prunedArtifacts,
    warnings,
  };
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

function buildContractLockFailureResponse(params: {
  error: unknown;
  startedAt: number;
}): NextResponse {
  const publishError = getPublishErrorDetails(params.error);
  const isUnconfigured = publishError.code === "unconfigured";
  return NextResponse.json(
    {
      ok: false,
      error: isUnconfigured ? "catalog_publish_unconfigured" : "catalog_publish_failed",
      recovery: isUnconfigured ? "configure_catalog_contract" : "review_catalog_contract",
      durationMs: Date.now() - params.startedAt,
      publishStatus: publishError.status,
    },
    { status: isUnconfigured ? 503 : 502 },
  );
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

function buildDeployHookUnconfiguredResponse(startedAt: number): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "deploy_hook_unconfigured",
      recovery: "configure_deploy_hook",
      durationMs: Date.now() - startedAt,
    },
    { status: 503 },
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
  const deployStatePaths = resolveDeployStatePaths(uploaderDataDir, storefrontId);
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

  const preValidation = await runOptionalPreValidation({
    strict: payload.options.strict === true,
    repoRoot,
    validateScriptPath: scriptPaths.validate,
    validateArgs,
    startedAt,
  });
  if (preValidation.errorResponse) {
    return preValidation.errorResponse;
  }
  const { validateResult } = preValidation;

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
  let deployPending: DeployPendingState | null = null;
  if (!payload.options.dryRun) {
    const contractReadiness = getCatalogContractReadiness();
    if (contractReadiness.configured && isDeployHookRequired() && !isDeployHookConfigured()) {
      return buildDeployHookUnconfiguredResponse(startedAt);
    }

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
        statePaths: deployStatePaths,
      });
      deployPending = await reconcileDeployPendingState({
        storefrontId,
        kv,
        result: deployResult,
        statePaths: deployStatePaths,
      }).catch(() => null);
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
        deployPending: deployPending ?? undefined,
        display: buildDisplaySyncGuidance(deployResult, deployPending),
      },
      { validate: validateResult, sync: syncResult },
    ),
  );
}

async function finalizeCloudPublishStateAndDeploy(params: {
  storefrontId: XaCatalogStorefront;
  snapshot: Awaited<ReturnType<typeof readCloudDraftSnapshot>>;
  publishableProducts: CatalogProductDraftInput[];
  kv: UploaderKvNamespace | null;
  warnings: string[];
}): Promise<{ deployResult: DeployTriggerResult; deployPending: DeployPendingState | null }> {
  const promotedIds = new Set(params.publishableProducts.map(productIdentity));
  const promotedProducts = params.snapshot.products.map((product) => {
    if (promotedIds.has(productIdentity(product))) {
      return { ...product, publishState: normalizePublishState(product) };
    }
    return { ...product, publishState: normalizePublishState(product) };
  });

  try {
    await writeCloudDraftSnapshot({
      storefront: params.storefrontId,
      products: promotedProducts,
      revisionsById: params.snapshot.revisionsById,
      ifMatchDocRevision: params.snapshot.docRevision,
    });
  } catch {
    params.warnings.push("publish_state_promotion_failed");
  }

  const deployResult = await maybeTriggerXaBDeploy({
    storefrontId: params.storefrontId,
    kv: params.kv,
  });
  const deployPending = await reconcileDeployPendingState({
    storefrontId: params.storefrontId,
    kv: params.kv,
    result: deployResult,
  }).catch(() => null);

  return { deployResult, deployPending };
}

async function tryPublishCloudCatalogPayload(params: {
  storefrontId: XaCatalogStorefront;
  startedAt: number;
  payload: Parameters<typeof publishCatalogPayloadToContract>[0]["payload"];
}): Promise<
  | { ok: true; result: Awaited<ReturnType<typeof publishCatalogPayloadToContract>> }
  | { ok: false; errorResponse: NextResponse }
> {
  try {
    const result = await publishCatalogPayloadToContract({
      storefrontId: params.storefrontId,
      payload: params.payload,
    });
    return { ok: true, result };
  } catch (error) {
    const publishError = getPublishErrorDetails(error);
    const isUnconfigured = publishError.code === "unconfigured";
    if (process.env.NODE_ENV !== "test") {
      console.error({
        route: "POST /api/catalog/sync",
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - params.startedAt,
      });
    }
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          ok: false,
          error: isUnconfigured ? "catalog_publish_unconfigured" : "catalog_publish_failed",
          recovery: isUnconfigured ? "configure_catalog_contract" : "review_catalog_contract",
          durationMs: Date.now() - params.startedAt,
          publishStatus: publishError.status,
        },
        { status: isUnconfigured ? 503 : 502 },
      ),
    };
  }
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
    return isCatalogPublishableState(state);
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
  const mediaValidationPolicy = resolveCloudMediaValidationPolicy(payload.options);
  try {
    builtArtifacts = await buildCatalogArtifactsFromDrafts({
      storefront: storefrontId,
      products: publishableProducts,
      strict: payload.options.strict === true,
      mediaValidationPolicy,
      allowedExternalImageHosts: getCloudAllowedExternalImageHosts(),
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

  const cloudMediaValidation = await applyCloudMediaExistenceValidation({
    artifacts: builtArtifacts,
    policy: mediaValidationPolicy,
  });
  if (cloudMediaValidation.ok === false) {
    return cloudMediaValidation.errorResponse;
  }
  builtArtifacts = cloudMediaValidation.artifacts;

  const warnings = [...builtArtifacts.warnings, ...cloudMediaValidation.warnings];
  const catalog = builtArtifacts.catalog;
  const mediaIndex = {
    ...builtArtifacts.mediaIndex,
    totals: {
      ...builtArtifacts.mediaIndex.totals,
      warnings: warnings.length,
      media: builtArtifacts.mediaIndex.items.length,
    },
  };

  let publishResult: { version?: string; publishedAt?: string } | null = null;
  let publishSkipped = false;
  let deployResult: DeployTriggerResult | undefined;
  let deployPending: DeployPendingState | null = null;
  if (!payload.options.dryRun) {
    const contractReadiness = getCatalogContractReadiness();
    if (!contractReadiness.configured) {
      publishSkipped = true;
    } else {
      if (isDeployHookRequired() && !isDeployHookConfigured()) {
        return buildDeployHookUnconfiguredResponse(startedAt);
      }
      const publishOutcome = await tryPublishCloudCatalogPayload({
        storefrontId,
        startedAt,
        payload: {
          storefront: storefrontId,
          publishedAt: new Date().toISOString(),
          catalog,
          mediaIndex,
        },
      });
      if ("errorResponse" in publishOutcome) {
        return publishOutcome.errorResponse;
      }
      publishResult = publishOutcome.result;
    }

    if (!publishSkipped) {
      const publishFinalize = await finalizeCloudPublishStateAndDeploy({
        storefrontId,
        snapshot,
        publishableProducts,
        kv,
        warnings,
      });
      deployResult = publishFinalize.deployResult;
      deployPending = publishFinalize.deployPending;
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
    deployPending: deployPending ?? undefined,
    warnings,
    counts: {
      products: catalog.products.length,
      media: mediaIndex.totals.media,
    },
    display: buildDisplaySyncGuidance(deployResult, deployPending),
  });
}

export async function POST(request: Request) {
  if (process.env.XA_UPLOADER_MODE === "vendor") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payloadRequest = request.clone();
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    // Intentionally do not attach rate-limit headers on unauthenticated 404
    // responses to reduce endpoint-shape leakage.
    return NextResponse.json({ ok: false }, { status: 404 });
  }

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

  let payload: SyncPayload = { options: {}, storefront: null };
  try {
    payload = await parseSyncPayload(payloadRequest);
  } catch (error) {
    return withRateHeaders(getPayloadParseErrorResponse(error), limit);
  }

  const startedAt = Date.now();
  const repoRoot = resolveRepoRoot();

  const storefrontId = parseStorefront(payload.storefront);
  const localFsRuntimeEnabled = isLocalFsRuntimeEnabled();

  const kv = await getUploaderKv();
  let mutexAcquired = false;
  let cloudSyncLock: CloudSyncLockLease | null = null;

  if (localFsRuntimeEnabled) {
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
  } else {
    try {
      const acquired = await acquireCloudSyncLock(storefrontId);
      if (acquired.status === "busy") {
        return withRateHeaders(
          NextResponse.json(
            { ok: false, error: "conflict", reason: "sync_already_running" },
            { status: 409 },
          ),
          limit,
        );
      }
      cloudSyncLock = acquired.lock;
    } catch (error) {
      return withRateHeaders(buildContractLockFailureResponse({ error, startedAt }), limit);
    }
  }

  let response: NextResponse;
  try {
    response = localFsRuntimeEnabled
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
    if (localFsRuntimeEnabled && kv && mutexAcquired) {
      try {
        await releaseSyncMutex(kv, storefrontId);
      } catch {
        // Release failure is non-fatal — TTL will self-expire in 5 minutes.
      }
    }
    if (!localFsRuntimeEnabled && cloudSyncLock) {
      await releaseCloudSyncLock(cloudSyncLock).catch(() => null);
    }
  }
  return withRateHeaders(response, limit);
}

export async function GET(request: Request) {
  if (process.env.XA_UPLOADER_MODE === "vendor") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

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
      mode: "local",
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
