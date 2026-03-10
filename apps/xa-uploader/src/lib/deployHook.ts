/* eslint-disable security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] deploy state paths derive from validated storefront ids */
import fs from "node:fs/promises";
import path from "node:path";

import { toPositiveInt } from "@acme/lib";

import type { XaCatalogStorefront } from "./catalogStorefront.types";
import type { UploaderKvNamespace } from "./syncMutex";
import { getErrorMessage, isRecord, sleep } from "./typeGuards";
import {
  XA_B_DEPLOY_HOOK_REQUIRED_ENV,
  XA_B_DEPLOY_HOOK_TOKEN_ENV,
  XA_B_DEPLOY_HOOK_URL_ENV,
} from "./uploaderRuntimeConfig";

export type DeployTriggerStatus =
  | "triggered"
  | "skipped_unconfigured"
  | "skipped_cooldown"
  | "skipped_runtime_live_catalog"
  | "failed";

export type DeployTriggerResult = {
  status: DeployTriggerStatus;
  nextEligibleAt?: string;
  reason?: string;
  httpStatus?: number;
  attempts?: number;
};

export type DeployPendingReasonCode = "cooldown" | "failed" | "unconfigured";

export type DeployPendingState = {
  pending: true;
  storefront: XaCatalogStorefront;
  reasonCode: DeployPendingReasonCode;
  reason?: string;
  nextEligibleAt?: string;
  firstDetectedAt: string;
  lastUpdatedAt: string;
  lastAttemptAt?: string;
  attempts: number;
};

type DeployStatePaths = {
  cooldownStatePath?: string;
  pendingStatePath?: string;
};

type DeployHookAttemptResult =
  | { ok: true }
  | { ok: false; transient: boolean; reason: string; httpStatus?: number };

export interface DeployHookServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare global {
  interface CloudflareEnv {
    XA_CATALOG_CONTRACT_SERVICE?: DeployHookServiceBinding;
  }
}

const DEPLOY_HOOK_TIMEOUT_MS_DEFAULT = 15_000;
const DEPLOY_HOOK_COOLDOWN_SECONDS_DEFAULT = 900;
const DEPLOY_HOOK_MAX_RETRIES_DEFAULT = 2;
const DEPLOY_HOOK_MAX_RETRIES_LIMIT = 5;
const DEPLOY_HOOK_RETRY_BASE_DELAY_MS_DEFAULT = 800;
const DEPLOY_HOOK_RETRY_BASE_DELAY_MS_MAX = 5_000;
const WORKERS_DEV_HOST_SUFFIX = ".workers.dev";
const CLOUDFLARE_API_HOST = "api.cloudflare.com";
const CLOUDFLARE_PAGES_HOOK_PATH_SEGMENT = "/pages/webhooks/";

function parseBooleanFlag(rawValue: string | undefined): boolean | null {
  const value = rawValue?.trim().toLowerCase();
  if (!value) return null;
  if (value === "1" || value === "true" || value === "yes" || value === "on") return true;
  if (value === "0" || value === "false" || value === "no" || value === "off") return false;
  return null;
}

function getDeployHookMaxRetries(): number {
  const raw = process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES?.trim();
  if (!raw) return DEPLOY_HOOK_MAX_RETRIES_DEFAULT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEPLOY_HOOK_MAX_RETRIES_DEFAULT;
  return Math.min(parsed, DEPLOY_HOOK_MAX_RETRIES_LIMIT);
}

function getDeployHookRetryBaseDelayMs(): number {
  return Math.min(
    toPositiveInt(
      process.env.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS,
      DEPLOY_HOOK_RETRY_BASE_DELAY_MS_DEFAULT,
      1,
    ),
    DEPLOY_HOOK_RETRY_BASE_DELAY_MS_MAX,
  );
}

function getDeployHookCooldownKey(storefrontId: XaCatalogStorefront): string {
  return `xa-deploy-cooldown:${storefrontId}`;
}

function getDeployPendingStateKey(storefrontId: XaCatalogStorefront): string {
  return `xa-deploy-pending:${storefrontId}`;
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

function parseDeployPendingState(raw: string | null): DeployPendingState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DeployPendingState>;
    if (parsed.pending !== true) return null;
    if (typeof parsed.storefront !== "string") return null;
    if (
      parsed.reasonCode !== "cooldown" &&
      parsed.reasonCode !== "failed" &&
      parsed.reasonCode !== "unconfigured"
    ) {
      return null;
    }
    if (typeof parsed.firstDetectedAt !== "string" || typeof parsed.lastUpdatedAt !== "string") {
      return null;
    }
    const attempts =
      typeof parsed.attempts === "number" && Number.isFinite(parsed.attempts) && parsed.attempts >= 0
        ? parsed.attempts
        : 0;
    return {
      pending: true,
      storefront: parsed.storefront as XaCatalogStorefront,
      reasonCode: parsed.reasonCode,
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
      nextEligibleAt: typeof parsed.nextEligibleAt === "string" ? parsed.nextEligibleAt : undefined,
      firstDetectedAt: parsed.firstDetectedAt,
      lastUpdatedAt: parsed.lastUpdatedAt,
      lastAttemptAt: typeof parsed.lastAttemptAt === "string" ? parsed.lastAttemptAt : undefined,
      attempts,
    };
  } catch {
    return null;
  }
}

async function readDeployStateRaw(params: {
  kv: UploaderKvNamespace | null;
  kvKey: string;
  statePath?: string;
}): Promise<string | null> {
  if (params.kv) {
    return await params.kv.get(params.kvKey);
  }
  if (!params.statePath) return null;
  try {
    return await fs.readFile(params.statePath, "utf8");
  } catch {
    return null;
  }
}

async function writeDeployStateRaw(params: {
  kv: UploaderKvNamespace | null;
  kvKey: string;
  payload: string;
  statePath?: string;
  expirationTtl?: number;
}): Promise<void> {
  if (params.kv) {
    await params.kv.put(params.kvKey, params.payload, params.expirationTtl ? { expirationTtl: params.expirationTtl } : undefined);
    return;
  }
  if (!params.statePath) return;
  await fs.mkdir(path.dirname(params.statePath), { recursive: true });
  await fs.writeFile(`${params.statePath}.tmp`, `${params.payload}\n`, "utf8");
  await fs.rename(`${params.statePath}.tmp`, params.statePath);
}

async function deleteDeployState(params: {
  kv: UploaderKvNamespace | null;
  kvKey: string;
  statePath?: string;
}): Promise<void> {
  if (params.kv) {
    await params.kv.delete(params.kvKey);
    return;
  }
  if (!params.statePath) return;
  await fs.rm(params.statePath, { force: true });
}

function getDeployHookTimeoutMs(): number {
  return toPositiveInt(process.env.XA_B_DEPLOY_HOOK_TIMEOUT_MS, DEPLOY_HOOK_TIMEOUT_MS_DEFAULT, 1);
}

function getDeployHookCooldownSeconds(): number {
  return toPositiveInt(
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS,
    DEPLOY_HOOK_COOLDOWN_SECONDS_DEFAULT,
    1,
  );
}

function getDeployHookUrl(): string {
  return (process.env[XA_B_DEPLOY_HOOK_URL_ENV] ?? "").trim();
}

function getDeployHookToken(): string {
  return (process.env[XA_B_DEPLOY_HOOK_TOKEN_ENV] ?? "").trim();
}

function shouldUseDeployServiceBinding(hookUrl: string): boolean {
  try {
    const parsed = new URL(hookUrl);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(WORKERS_DEV_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function asServiceBindingDeployUrl(hookUrl: string): string {
  const parsed = new URL(hookUrl);
  return `https://catalog-contract.internal${parsed.pathname}${parsed.search}`;
}

async function getDeployServiceBinding(): Promise<DeployHookServiceBinding | null> {
  const allowCloudflareContextInTests =
    parseBooleanFlag(process.env.XA_TEST_ENABLE_CLOUDFLARE_CONTEXT) === true;
  if (process.env.JEST_WORKER_ID && !allowCloudflareContextInTests) {
    return null;
  }
  try {
    // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] module specifier
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return env.XA_CATALOG_CONTRACT_SERVICE ?? null;
  } catch {
    return null;
  }
}

async function requestDeployHook(hookUrl: string, init: RequestInit): Promise<Response> {
  const serviceBinding = await getDeployServiceBinding();
  if (serviceBinding && shouldUseDeployServiceBinding(hookUrl)) {
    return serviceBinding.fetch(asServiceBindingDeployUrl(hookUrl), init);
  }
  return fetch(hookUrl, init);
}

function buildRetryDelayMs(attemptNumber: number): number {
  const baseDelayMs = getDeployHookRetryBaseDelayMs();
  const exponent = Math.max(0, attemptNumber - 1);
  return baseDelayMs * 2 ** exponent;
}


function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function responseDetails(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 160);
}

function parseJsonRecord(rawBodyText: string): Record<string, unknown> | null {
  const normalized = rawBodyText.trim();
  if (!normalized) return null;
  try {
    const parsed = JSON.parse(normalized) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type DeployHookValidationMode = "xa_drop_worker" | "cloudflare_pages_hook" | "generic";

function resolveDeployHookValidationMode(hookUrl: string): DeployHookValidationMode {
  try {
    const parsed = new URL(hookUrl);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(WORKERS_DEV_HOST_SUFFIX) &&
      parsed.pathname.startsWith("/deploy/")
    ) {
      return "xa_drop_worker";
    }
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === CLOUDFLARE_API_HOST &&
      parsed.pathname.includes(CLOUDFLARE_PAGES_HOOK_PATH_SEGMENT)
    ) {
      return "cloudflare_pages_hook";
    }
    return "generic";
  } catch {
    return "generic";
  }
}

function validateDeployHookSuccess(params: {
  hookUrl: string;
  storefrontId: XaCatalogStorefront;
  responseBodyText: string;
}): { ok: true } | { ok: false; reason: string } {
  const mode = resolveDeployHookValidationMode(params.hookUrl);
  const payload = parseJsonRecord(params.responseBodyText);

  if (mode === "xa_drop_worker") {
    if (!payload) {
      return { ok: false, reason: "deploy_ack_missing" };
    }
    if (payload.ok !== true) {
      return { ok: false, reason: "deploy_ack_not_ok" };
    }
    if (typeof payload.provider !== "string" || !payload.provider.trim()) {
      return { ok: false, reason: "deploy_ack_provider_missing" };
    }
    if (payload.storefront !== params.storefrontId) {
      return { ok: false, reason: "deploy_ack_storefront_mismatch" };
    }
    return { ok: true };
  }

  if (payload?.ok === false || payload?.success === false) {
    return { ok: false, reason: "deploy_ack_rejected" };
  }

  return { ok: true };
}

async function triggerDeployHookOnce(params: {
  hookUrl: string;
  storefrontId: XaCatalogStorefront;
}): Promise<DeployHookAttemptResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getDeployHookTimeoutMs());
  let response: Response;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getDeployHookToken();
    if (token) {
      headers["X-XA-Deploy-Token"] = token;
    }

    response = await requestDeployHook(params.hookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        storefront: params.storefrontId,
        triggeredBy: "xa-uploader-sync",
        triggeredAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const message = getErrorMessage(error);
    return {
      ok: false,
      transient: true,
      reason: message,
    };
  }
  clearTimeout(timeout);
  const bodyText = await response.text().catch(() => "");
  const details = responseDetails(bodyText);

  if (response.ok) {
    const validation = validateDeployHookSuccess({
      hookUrl: params.hookUrl,
      storefrontId: params.storefrontId,
      responseBodyText: bodyText,
    });
    if (!validation.ok) {
      const failedValidation = validation as Extract<
        ReturnType<typeof validateDeployHookSuccess>,
        { ok: false }
      >;
      return {
        ok: false,
        transient: false,
        reason: details ? `${failedValidation.reason}:${details}` : failedValidation.reason,
        httpStatus: response.status,
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    transient: isTransientHttpStatus(response.status),
    reason: details ? `http_${response.status}:${details}` : `http_${response.status}`,
    httpStatus: response.status,
  };
}

export function getDeployCooldownStatePath(
  uploaderDataDir: string,
  storefrontId: XaCatalogStorefront,
): string {
  return path.join(uploaderDataDir, "deploy-cooldown", `${storefrontId}.json`);
}

export function getDeployPendingStatePath(
  uploaderDataDir: string,
  storefrontId: XaCatalogStorefront,
): string {
  return path.join(uploaderDataDir, "deploy-pending", `${storefrontId}.json`);
}

export function resolveDeployStatePaths(
  uploaderDataDir: string,
  storefrontId: XaCatalogStorefront,
): Required<DeployStatePaths> {
  return {
    cooldownStatePath: getDeployCooldownStatePath(uploaderDataDir, storefrontId),
    pendingStatePath: getDeployPendingStatePath(uploaderDataDir, storefrontId),
  };
}

export function isDeployHookConfigured(): boolean {
  return Boolean(getDeployHookUrl());
}

export function isDeployHookRequired(): boolean {
  const explicit = parseBooleanFlag(process.env[XA_B_DEPLOY_HOOK_REQUIRED_ENV]);
  if (explicit !== null) return explicit;
  return process.env.NODE_ENV === "production";
}

export async function readDeployCooldownEpochMs(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePath?: string;
}): Promise<number | null> {
  const raw = await readDeployStateRaw({
    kv: params.kv,
    kvKey: getDeployHookCooldownKey(params.storefrontId),
    statePath: params.statePath,
  });
  return parseNextEligibleAt(raw);
}

export async function readDeployPendingState(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePath?: string;
}): Promise<DeployPendingState | null> {
  const raw = await readDeployStateRaw({
    kv: params.kv,
    kvKey: getDeployPendingStateKey(params.storefrontId),
    statePath: params.statePath,
  });
  const parsed = parseDeployPendingState(raw);
  if (!parsed) return null;
  if (parsed.storefront !== params.storefrontId) return null;
  return parsed;
}

export async function clearDeployPendingState(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePath?: string;
}): Promise<void> {
  await deleteDeployState({
    kv: params.kv,
    kvKey: getDeployPendingStateKey(params.storefrontId),
    statePath: params.statePath,
  });
}

async function writeDeployCooldown(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  cooldownSeconds: number;
  nextEligibleAtMs: number;
  statePath?: string;
}): Promise<void> {
  const payload = JSON.stringify({
    storefront: params.storefrontId,
    nextEligibleAt: new Date(params.nextEligibleAtMs).toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await writeDeployStateRaw({
    kv: params.kv,
    kvKey: getDeployHookCooldownKey(params.storefrontId),
    statePath: params.statePath,
    payload,
    expirationTtl: params.cooldownSeconds,
  });
}

async function upsertDeployPendingState(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePath?: string;
  reasonCode: DeployPendingReasonCode;
  reason?: string;
  nextEligibleAt?: string;
  incrementAttempts: boolean;
}): Promise<DeployPendingState> {
  const existing = await readDeployPendingState({
    storefrontId: params.storefrontId,
    kv: params.kv,
    statePath: params.statePath,
  }).catch(() => null);

  const now = new Date().toISOString();
  const pending: DeployPendingState = {
    pending: true,
    storefront: params.storefrontId,
    reasonCode: params.reasonCode,
    reason: params.reason,
    nextEligibleAt: params.nextEligibleAt,
    firstDetectedAt: existing?.firstDetectedAt ?? now,
    lastUpdatedAt: now,
    lastAttemptAt: now,
    attempts: params.incrementAttempts ? (existing?.attempts ?? 0) + 1 : (existing?.attempts ?? 0),
  };

  await writeDeployStateRaw({
    kv: params.kv,
    kvKey: getDeployPendingStateKey(params.storefrontId),
    statePath: params.statePath,
    payload: JSON.stringify(pending, null, 2),
  });

  return pending;
}

export async function reconcileDeployPendingState(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  result: DeployTriggerResult;
  statePaths?: DeployStatePaths;
}): Promise<DeployPendingState | null> {
  if (params.result.status === "triggered" || params.result.status === "skipped_runtime_live_catalog") {
    await clearDeployPendingState({
      storefrontId: params.storefrontId,
      kv: params.kv,
      statePath: params.statePaths?.pendingStatePath,
    }).catch(() => undefined);
    return null;
  }

  if (params.result.status === "skipped_cooldown") {
    return await upsertDeployPendingState({
      storefrontId: params.storefrontId,
      kv: params.kv,
      statePath: params.statePaths?.pendingStatePath,
      reasonCode: "cooldown",
      reason: params.result.reason,
      nextEligibleAt: params.result.nextEligibleAt,
      incrementAttempts: false,
    });
  }

  if (params.result.status === "skipped_unconfigured") {
    return await upsertDeployPendingState({
      storefrontId: params.storefrontId,
      kv: params.kv,
      statePath: params.statePaths?.pendingStatePath,
      reasonCode: "unconfigured",
      reason: params.result.reason ?? "deploy_hook_unconfigured",
      incrementAttempts: false,
    });
  }

  return await upsertDeployPendingState({
    storefrontId: params.storefrontId,
    kv: params.kv,
    statePath: params.statePaths?.pendingStatePath,
    reasonCode: "failed",
    reason: params.result.reason,
    nextEligibleAt: params.result.nextEligibleAt,
    incrementAttempts: true,
  });
}

export async function maybeTriggerXaBDeploy(params: {
  storefrontId: XaCatalogStorefront;
  kv: UploaderKvNamespace | null;
  statePaths?: DeployStatePaths;
}): Promise<DeployTriggerResult> {
  const hookUrl = getDeployHookUrl();
  if (!hookUrl) {
    return { status: "skipped_unconfigured", reason: "deploy_hook_unconfigured" };
  }

  const cooldownSeconds = getDeployHookCooldownSeconds();
  const nowMs = Date.now();
  const nextEligibleAtMs = await readDeployCooldownEpochMs({
    storefrontId: params.storefrontId,
    kv: params.kv,
    statePath: params.statePaths?.cooldownStatePath,
  }).catch(() => null);
  if (nextEligibleAtMs !== null && nextEligibleAtMs > nowMs) {
    return {
      status: "skipped_cooldown",
      nextEligibleAt: new Date(nextEligibleAtMs).toISOString(),
    };
  }

  const maxAttempts = getDeployHookMaxRetries() + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await triggerDeployHookOnce({
      hookUrl,
      storefrontId: params.storefrontId,
    });
    if (result.ok) {
      const cooldownUntilMs = nowMs + cooldownSeconds * 1000;
      await writeDeployCooldown({
        storefrontId: params.storefrontId,
        kv: params.kv,
        statePath: params.statePaths?.cooldownStatePath,
        cooldownSeconds,
        nextEligibleAtMs: cooldownUntilMs,
      }).catch(() => undefined);

      return {
        status: "triggered",
        nextEligibleAt: new Date(cooldownUntilMs).toISOString(),
        attempts: attempt,
      };
    }

    const failedAttempt = result as Extract<DeployHookAttemptResult, { ok: false }>;
    if (!failedAttempt.transient || attempt >= maxAttempts) {
      return {
        status: "failed",
        reason:
          attempt > 1
            ? `${failedAttempt.reason} (after ${attempt} attempts)`
            : failedAttempt.reason,
        httpStatus: failedAttempt.httpStatus,
        attempts: attempt,
      };
    }

    await sleep(buildRetryDelayMs(attempt));
  }

  return { status: "failed", reason: "deploy_hook_retry_exhausted" };
}

export function buildDisplaySyncGuidance(
  deploy?: DeployTriggerResult,
  pending?: DeployPendingState | null,
) {
  const pendingPayload = pending
    ? {
        deployPending: true,
        deployPendingReasonCode: pending.reasonCode,
        deployPendingReason: pending.reason,
        deployPendingSince: pending.firstDetectedAt,
        deployPendingUpdatedAt: pending.lastUpdatedAt,
        deployPendingNextEligibleAt: pending.nextEligibleAt,
      }
    : {};

  if (deploy?.status === "triggered") {
    return {
      mode: "build_time_runtime_catalog",
      requiresXaBBuild: false,
      nextAction: "await_xa_b_deploy_and_verify_live",
      deployVerificationPending: true,
      deployStatus: deploy.status,
      nextEligibleAt: deploy.nextEligibleAt,
      ...pendingPayload,
    };
  }
  if (deploy?.status === "skipped_cooldown") {
    return {
      mode: "build_time_runtime_catalog",
      requiresXaBBuild: true,
      nextAction: "wait_or_manual_deploy_xa_b",
      deployStatus: deploy.status,
      nextEligibleAt: deploy.nextEligibleAt,
      ...pendingPayload,
    };
  }
  if (deploy?.status === "skipped_runtime_live_catalog") {
    return {
      mode: "runtime_live_catalog",
      requiresXaBBuild: false,
      nextAction: "verify_live_catalog_runtime",
      deployStatus: deploy.status,
      ...pendingPayload,
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
      ...pendingPayload,
    };
  }
  return {
    mode: "build_time_runtime_catalog",
    requiresXaBBuild: true,
    nextAction: "rebuild_and_deploy_xa_b",
    ...(deploy ? { deployStatus: deploy.status } : {}),
    ...(deploy?.nextEligibleAt ? { nextEligibleAt: deploy.nextEligibleAt } : {}),
    ...pendingPayload,
  };
}
