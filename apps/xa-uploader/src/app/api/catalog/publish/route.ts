import path from "node:path";

import { NextResponse } from "next/server";

import { type CatalogProductDraftInput, catalogProductDraftSchema } from "@acme/lib/xa";

import { applyCloudMediaExistenceValidation } from "../../../../lib/catalogCloudPublish";
import { publishCatalogPayloadToContract } from "../../../../lib/catalogContractClient";
import {
  acquireCloudSyncLock,
  type CloudSyncLockLease,
  readCloudCurrencyRates,
  readCloudDraftSnapshot,
  releaseCloudSyncLock,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { buildCatalogArtifactsFromDrafts } from "../../../../lib/catalogDraftToContract";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import {
  maybeTriggerXaBDeploy,
  reconcileDeployPendingState,
  resolveDeployStatePaths,
} from "../../../../lib/deployHook";
import { isLocalFsRuntimeEnabled } from "../../../../lib/localFsGuard";
import { resolveRepoRoot } from "../../../../lib/repoRoot";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { getUploaderKv } from "../../../../lib/syncMutex";
import { isRecord } from "../../../../lib/typeGuards";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const PUBLISH_PAYLOAD_MAX_BYTES = 64 * 1024;

type PublishRequestPayload = {
  storefront: string;
  draft: CatalogProductDraftInput;
  publishState?: "live" | "out_of_stock";
};


function parsePublishRequestPayload(input: unknown): PublishRequestPayload | null {
  if (!isRecord(input)) return null;

  const storefront = typeof input.storefront === "string" ? input.storefront.trim() : "";
  if (!storefront) return null;

  const parsedDraft = catalogProductDraftSchema.safeParse(input.draft);
  if (!parsedDraft.success) return null;

  return {
    storefront,
    draft: parsedDraft.data,
    publishState: input.publishState === "out_of_stock" ? "out_of_stock" : "live",
  };
}

function getInvalidPayloadResponse(error?: unknown): NextResponse {
  if (error instanceof PayloadTooLargeError) {
    return NextResponse.json({ ok: false, error: "payload_too_large", reason: "payload_too_large" }, { status: 413 });
  }
  if (error instanceof InvalidJsonError) {
    return NextResponse.json({ ok: false, error: "invalid", reason: "invalid_json" }, { status: 400 });
  }
  return NextResponse.json({ ok: false, error: "invalid", reason: "invalid_payload" }, { status: 400 });
}

async function resolveDeployStateContext(storefrontId: XaCatalogStorefront) {
  const kv = await getUploaderKv();
  const statePaths = isLocalFsRuntimeEnabled()
    ? resolveDeployStatePaths(path.join(resolveRepoRoot(), "apps", "xa-uploader", "data"), storefrontId)
    : undefined;
  return { kv, statePaths };
}

function buildPublishContractErrorResponse(error: Error & { code?: string }): NextResponse {
  const isInvalidRates = error.code === "invalid_response";
  return NextResponse.json(
    {
      ok: false,
      error: isInvalidRates ? "currency_rates_invalid" : "catalog_publish_unconfigured",
      recovery: isInvalidRates ? "save_currency_rates" : "configure_catalog_contract",
    },
    { status: isInvalidRates ? 409 : 503 },
  );
}

async function executeCloudPublish(params: {
  storefront: XaCatalogStorefront;
  publishedDraft: CatalogProductDraftInput;
}): Promise<NextResponse> {
  const [snapshot, currencyRates] = await Promise.all([
    readCloudDraftSnapshot(params.storefront),
    readCloudCurrencyRates(params.storefront),
  ]);
  if (currencyRates === null) {
    return NextResponse.json(
      { ok: false, error: "currency_rates_missing", recovery: "save_currency_rates" },
      { status: 409 },
    );
  }

  const liveDraftId = (params.publishedDraft.id ?? "").trim();
  const existingIndex =
    liveDraftId.length > 0
      ? snapshot.products.findIndex((product) => (product.id ?? "").trim() === liveDraftId)
      : -1;
  const mergedProducts =
    existingIndex >= 0
      ? snapshot.products.map((product, index) =>
          index === existingIndex ? params.publishedDraft : product,
        )
      : [...snapshot.products, params.publishedDraft];

  const artifacts = await buildCatalogArtifactsFromDrafts({
    storefront: params.storefront,
    products: mergedProducts,
    currencyRates,
    strict: false,
    mediaValidationPolicy: "warn",
  });

  const validation = await applyCloudMediaExistenceValidation({
    artifacts,
    policy: "warn",
  });
  const publishArtifacts = validation.ok ? validation.artifacts : artifacts;
  const warnings = [...publishArtifacts.warnings, ...(validation.ok ? validation.warnings : [])];

  try {
    await publishCatalogPayloadToContract({
      storefrontId: params.storefront,
      payload: {
        storefront: params.storefront,
        publishedAt: new Date().toISOString(),
        catalog: publishArtifacts.catalog,
        mediaIndex: publishArtifacts.mediaIndex,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "catalog_publish_failed" }, { status: 502 });
  }

  try {
    await writeCloudDraftSnapshot({
      storefront: params.storefront,
      products: mergedProducts,
      revisionsById: snapshot.revisionsById,
      ifMatchDocRevision: snapshot.docRevision,
    });
  } catch {
    warnings.push("publish_state_promotion_failed");
  }

  const deployStateContext = await resolveDeployStateContext(params.storefront);
  const deployResult =
    params.storefront === "xa-b"
      ? { status: "skipped_runtime_live_catalog" as const, reason: "live_catalog_runtime_enabled" }
      : await maybeTriggerXaBDeploy({
          storefrontId: params.storefront,
          kv: deployStateContext.kv,
          statePaths: deployStateContext.statePaths,
        });
  await reconcileDeployPendingState({
    storefrontId: params.storefront,
    kv: deployStateContext.kv,
    statePaths: deployStateContext.statePaths,
    result: deployResult,
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    deployStatus: deployResult.status,
    deployReason: deployResult.reason,
    deployNextEligibleAt: deployResult.nextEligibleAt,
    warnings,
  });
}

export async function POST(request: Request) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let rawPayload: unknown;
  try {
    rawPayload = await readJsonBodyWithLimit(request, PUBLISH_PAYLOAD_MAX_BYTES);
  } catch (error) {
    return getInvalidPayloadResponse(error);
  }

  const payload = parsePublishRequestPayload(rawPayload);
  if (!payload) {
    return getInvalidPayloadResponse();
  }

  const storefront = payload.storefront as XaCatalogStorefront;
  const publishState = payload.publishState ?? "live";
  const publishedDraft: CatalogProductDraftInput = {
    ...payload.draft,
    publishState,
  };

  let cloudSyncLock: CloudSyncLockLease | null = null;

  try {
    const acquired = await acquireCloudSyncLock(storefront);
    if (acquired.status === "busy") {
      return NextResponse.json({ ok: false, error: "sync_locked" }, { status: 409 });
    }
    cloudSyncLock = acquired.lock;
  } catch (lockError) {
    const message = lockError instanceof Error ? lockError.message : String(lockError);
    return NextResponse.json({ ok: false, error: "lock_failed", reason: message }, { status: 503 });
  }

  try {
    return await executeCloudPublish({
      storefront,
      publishedDraft,
    });
  } catch (internalError) {
    if (internalError instanceof Error && internalError.name === "CatalogDraftContractError") {
      return buildPublishContractErrorResponse(internalError as Error & { code?: string });
    }
    const message = internalError instanceof Error ? internalError.message : String(internalError);
    return NextResponse.json({ ok: false, error: "internal_error", reason: message }, { status: 500 });
  } finally {
    if (cloudSyncLock) {
      await releaseCloudSyncLock(cloudSyncLock);
    }
  }
}
