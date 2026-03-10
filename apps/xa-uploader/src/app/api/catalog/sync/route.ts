import { NextResponse } from "next/server";

import {
  type CatalogProductDraftInput,
  deriveCatalogPublishState,
  isCatalogPublishableState,
} from "@acme/lib/xa";

import {
  applyCloudMediaExistenceValidation,
  type CloudBuiltArtifacts,
  type MediaValidationPolicy,
} from "../../../../lib/catalogCloudPublish";
import {
  type CatalogPublishError,
  getCatalogContractReadiness,
  publishCatalogPayloadToContract,
} from "../../../../lib/catalogContractClient";
import {
  acquireCloudSyncLock,
  CatalogDraftContractError,
  type CloudSyncLockLease,
  readCloudCurrencyRates,
  readCloudDraftSnapshot,
  releaseCloudSyncLock,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { buildCatalogArtifactsFromDrafts } from "../../../../lib/catalogDraftToContract";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import type { CurrencyRates } from "../../../../lib/currencyRates";
import {
  buildDisplaySyncGuidance,
  type DeployPendingState,
  type DeployTriggerResult,
  isDeployHookConfigured,
  isDeployHookRequired,
  maybeTriggerXaBDeploy,
  reconcileDeployPendingState,
} from "../../../../lib/deployHook";
import { getRequestIp, rateLimit, withRateHeaders } from "../../../../lib/rateLimit";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import {
  getUploaderKv,
  type UploaderKvNamespace,
} from "../../../../lib/syncMutex";
import { isRecord } from "../../../../lib/typeGuards";
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

type SyncPayload = {
  options: SyncOptions;
  storefront: string | null;
};

const SYNC_WINDOW_MS = 60 * 1000;
const SYNC_MAX_REQUESTS = 3;
const SYNC_READINESS_WINDOW_MS = 60 * 1000;
const SYNC_READINESS_MAX_REQUESTS = 30;
const SYNC_PAYLOAD_MAX_BYTES = 24 * 1024;

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


async function finalizeCloudPublishStateAndDeploy(params: {
  storefrontId: XaCatalogStorefront;
  snapshot: Awaited<ReturnType<typeof readCloudDraftSnapshot>>;
  kv: UploaderKvNamespace | null;
  warnings: string[];
}): Promise<{ deployResult: DeployTriggerResult; deployPending: DeployPendingState | null }> {
  const promotedProducts = params.snapshot.products.map((product) => ({
    ...product,
    publishState: deriveCatalogPublishState(product),
  }));

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

async function loadCloudSyncInputs(params: {
  storefrontId: XaCatalogStorefront;
  startedAt: number;
}): Promise<
  | {
      ok: true;
      snapshot: Awaited<ReturnType<typeof readCloudDraftSnapshot>>;
      currencyRates: CurrencyRates | null;
    }
  | { ok: false; errorResponse: NextResponse }
> {
  try {
    const [snapshot, currencyRates] = await Promise.all([
      readCloudDraftSnapshot(params.storefrontId),
      readCloudCurrencyRates(params.storefrontId),
    ]);
    return { ok: true, snapshot, currencyRates };
  } catch (error) {
    if (error instanceof CatalogDraftContractError) {
      const isInvalidRates = error.code === "invalid_response";
      return {
        ok: false,
        errorResponse: NextResponse.json(
          {
            ok: false,
            error: isInvalidRates ? "currency_rates_invalid" : "catalog_publish_unconfigured",
            recovery: isInvalidRates ? "save_currency_rates" : "configure_catalog_contract",
            currencyRatesPath: `cloud-currency-rates://${params.storefrontId}`,
            durationMs: Date.now() - params.startedAt,
          },
          { status: isInvalidRates ? 409 : 503 },
        ),
      };
    }
    throw error;
  }
}

function buildMissingCloudCurrencyRatesResponse(params: {
  storefrontId: XaCatalogStorefront;
  startedAt: number;
}): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "currency_rates_missing",
      recovery: "save_currency_rates",
      currencyRatesPath: `cloud-currency-rates://${params.storefrontId}`,
      durationMs: Date.now() - params.startedAt,
    },
    { status: 409 },
  );
}

async function completeCloudPublishAndDeploy(params: {
  storefrontId: XaCatalogStorefront;
  startedAt: number;
  payload: SyncPayload;
  kv: UploaderKvNamespace | null;
  snapshot: Awaited<ReturnType<typeof readCloudDraftSnapshot>>;
  publishableProducts: CatalogProductDraftInput[];
  warnings: string[];
  catalog: CloudBuiltArtifacts["catalog"];
  mediaIndex: CloudBuiltArtifacts["mediaIndex"];
}): Promise<
  | {
      ok: true;
      publishResult: { version?: string; publishedAt?: string } | null;
      publishSkipped: boolean;
      deployResult: DeployTriggerResult | undefined;
      deployPending: DeployPendingState | null;
    }
  | { ok: false; errorResponse: NextResponse }
> {
  let publishResult: { version?: string; publishedAt?: string } | null = null;
  let publishSkipped = false;
  let deployResult: DeployTriggerResult | undefined;
  let deployPending: DeployPendingState | null = null;

  if (!params.payload.options.dryRun) {
    const contractReadiness = getCatalogContractReadiness();
    if (!contractReadiness.configured) {
      publishSkipped = true;
    } else {
      if (isDeployHookRequired() && !isDeployHookConfigured()) {
        return { ok: false, errorResponse: buildDeployHookUnconfiguredResponse(params.startedAt) };
      }
      const publishOutcome = await tryPublishCloudCatalogPayload({
        storefrontId: params.storefrontId,
        startedAt: params.startedAt,
        payload: {
          storefront: params.storefrontId,
          publishedAt: new Date().toISOString(),
          catalog: params.catalog,
          mediaIndex: params.mediaIndex,
        },
      });
      if ("errorResponse" in publishOutcome) {
        return { ok: false, errorResponse: publishOutcome.errorResponse };
      }
      publishResult = publishOutcome.result;
    }

    if (!publishSkipped) {
      const publishFinalize = await finalizeCloudPublishStateAndDeploy({
        storefrontId: params.storefrontId,
        snapshot: params.snapshot,
        kv: params.kv,
        warnings: params.warnings,
      });
      deployResult = publishFinalize.deployResult;
      deployPending = publishFinalize.deployPending;
    }
  }

  return {
    ok: true,
    publishResult,
    publishSkipped,
    deployResult,
    deployPending,
  };
}

async function runCloudSyncPipeline(params: {
  storefrontId: XaCatalogStorefront;
  payload: SyncPayload;
  startedAt: number;
  kv: UploaderKvNamespace | null;
}): Promise<NextResponse> {
  const { storefrontId, payload, startedAt, kv } = params;
  const loaded = await loadCloudSyncInputs({ storefrontId, startedAt });
  if (loaded.ok === false) {
    return loaded.errorResponse;
  }

  const { snapshot, currencyRates } = loaded;
  const publishableProducts = snapshot.products.filter((product) =>
    isCatalogPublishableState(deriveCatalogPublishState(product)),
  );

  if (currencyRates === null) {
    return buildMissingCloudCurrencyRatesResponse({ storefrontId, startedAt });
  }

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

  let builtArtifacts: CloudBuiltArtifacts;
  const mediaValidationPolicy = resolveCloudMediaValidationPolicy(payload.options);
  try {
    builtArtifacts = await buildCatalogArtifactsFromDrafts({
      storefront: storefrontId,
      products: publishableProducts,
      currencyRates,
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

  const publishState = await completeCloudPublishAndDeploy({
    storefrontId,
    startedAt,
    payload,
    kv,
    snapshot,
    publishableProducts,
    warnings,
    catalog,
    mediaIndex,
  });
  if (publishState.ok === false) {
    return publishState.errorResponse;
  }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    dryRun: Boolean(payload.options.dryRun),
    mode: "cloud",
    publishSkipped: publishState.publishSkipped || undefined,
    publishedVersion: publishState.publishResult?.version,
    publishedAt: publishState.publishResult?.publishedAt,
    deploy: publishState.deployResult,
    deployPending: publishState.deployPending ?? undefined,
    warnings,
    counts: {
      products: catalog.products.length,
      media: mediaIndex.totals.media,
    },
    display: buildDisplaySyncGuidance(publishState.deployResult, publishState.deployPending),
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
  const storefrontId = parseStorefront(payload.storefront);

  const kv = await getUploaderKv();
  let cloudSyncLock: CloudSyncLockLease | null = null;
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

  let response: NextResponse;
  try {
    response = await runCloudSyncPipeline({
      storefrontId,
      payload,
      startedAt,
      kv,
    });
  } finally {
    if (cloudSyncLock) {
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

  const contractReadiness = getCatalogContractReadiness();
  if (!contractReadiness.configured) {
    return withRateHeaders(
      NextResponse.json({
        ok: true,
        ready: false,
        missingScripts: [],
        contractConfigured: false,
        contractConfigErrors: contractReadiness.errors,
        mode: "cloud",
        recovery: "configure_catalog_contract",
        checkedAt: new Date().toISOString(),
      }),
      limit,
    );
  }

  const storefront = new URL(request.url).searchParams.get("storefront");
  const storefrontId = parseStorefront(storefront);
  try {
    const currencyRates = await readCloudCurrencyRates(storefrontId);
    const ready = currencyRates !== null;
    return withRateHeaders(
      NextResponse.json({
        ok: true,
        ready,
        missingScripts: [],
        contractConfigured: true,
        contractConfigErrors: [],
        mode: "cloud",
        recovery: ready ? undefined : "save_currency_rates",
        checkedAt: new Date().toISOString(),
      }),
      limit,
    );
  } catch (error) {
    if (error instanceof CatalogDraftContractError && error.code === "invalid_response") {
      return withRateHeaders(
        NextResponse.json({
          ok: true,
          ready: false,
          missingScripts: [],
          contractConfigured: true,
          contractConfigErrors: [],
          mode: "cloud",
          recovery: "save_currency_rates",
          checkedAt: new Date().toISOString(),
        }),
        limit,
      );
    }
    return withRateHeaders(
      NextResponse.json({
        ok: true,
        ready: false,
        missingScripts: [],
        contractConfigured: true,
        contractConfigErrors: [],
        mode: "cloud",
        recovery: "review_catalog_contract",
        checkedAt: new Date().toISOString(),
      }),
      limit,
    );
  }
}
