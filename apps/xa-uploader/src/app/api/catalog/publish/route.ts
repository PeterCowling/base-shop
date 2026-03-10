import { NextResponse } from "next/server";

import { applyCloudMediaExistenceValidation } from "../../../../lib/catalogCloudPublish";
import { publishCatalogPayloadToContract } from "../../../../lib/catalogContractClient";
import {
  acquireCloudSyncLock,
  CatalogDraftConflictError,
  CatalogDraftContractError,
  type CloudSyncLockLease,
  readCloudCurrencyRates,
  readCloudDraftSnapshot,
  releaseCloudSyncLock,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { buildCatalogArtifactsFromDrafts } from "../../../../lib/catalogDraftToContract";
import { updateProductPublishStateInCloudSnapshot } from "../../../../lib/catalogPublishState";
import { parseStorefront } from "../../../../lib/catalogStorefront";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import {
  maybeTriggerXaBDeploy,
  reconcileDeployPendingState,
} from "../../../../lib/deployHook";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { getUploaderKv } from "../../../../lib/syncMutex";
import { getErrorMessage, isRecord } from "../../../../lib/typeGuards";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const PUBLISH_PAYLOAD_MAX_BYTES = 64 * 1024;

type PublishRequestPayload = {
  storefront: string;
  draftId: string;
  ifMatch: string;
  publishState?: "live" | "out_of_stock";
};


function parsePublishRequestPayload(input: unknown): PublishRequestPayload | null {
  if (!isRecord(input)) return null;

  const storefront = typeof input.storefront === "string" ? input.storefront.trim() : "";
  if (!storefront) return null;
  const draftId = typeof input.draftId === "string" ? input.draftId.trim() : "";
  const ifMatch = typeof input.ifMatch === "string" ? input.ifMatch.trim() : "";
  if (!draftId || !ifMatch) return null;

  return {
    storefront,
    draftId,
    ifMatch,
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


function buildPublishContractErrorResponse(error: CatalogDraftContractError): NextResponse {
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
  draftId: string;
  ifMatch: string;
  publishState: "live" | "out_of_stock";
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

  const updatedSnapshot = updateProductPublishStateInCloudSnapshot({
    snapshot,
    productId: params.draftId,
    ifMatch: params.ifMatch,
    publishState: params.publishState,
  });
  if (!updatedSnapshot) {
    return NextResponse.json(
      { ok: false, error: "not_found", reason: "product_not_found" },
      { status: 404 },
    );
  }

  const artifacts = await buildCatalogArtifactsFromDrafts({
    storefront: params.storefront,
    products: updatedSnapshot.products,
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
      products: updatedSnapshot.products,
      revisionsById: updatedSnapshot.revisionsById,
      ifMatchDocRevision: snapshot.docRevision,
    });
  } catch {
    warnings.push("publish_state_promotion_failed");
  }

  const kv = await getUploaderKv();
  const deployResult =
    params.storefront === "xa-b"
      ? { status: "skipped_runtime_live_catalog" as const, reason: "live_catalog_runtime_enabled" }
      : await maybeTriggerXaBDeploy({ storefrontId: params.storefront, kv, statePaths: undefined });
  await reconcileDeployPendingState({
    storefrontId: params.storefront,
    kv,
    statePaths: undefined,
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

  const storefront: XaCatalogStorefront = parseStorefront(payload.storefront);

  let cloudSyncLock: CloudSyncLockLease | null = null;

  try {
    const acquired = await acquireCloudSyncLock(storefront);
    if (acquired.status === "busy") {
      return NextResponse.json({ ok: false, error: "sync_locked" }, { status: 409 });
    }
    cloudSyncLock = acquired.lock;
  } catch (lockError) {
    const message = getErrorMessage(lockError);
    return NextResponse.json({ ok: false, error: "lock_failed", reason: message }, { status: 503 });
  }

  try {
    return await executeCloudPublish({
      storefront,
      draftId: payload.draftId,
      ifMatch: payload.ifMatch,
      publishState: payload.publishState ?? "live",
    });
  } catch (internalError) {
    if (internalError instanceof CatalogDraftConflictError) {
      return NextResponse.json(
        { ok: false, error: "conflict", reason: "revision_conflict" },
        { status: 409 },
      );
    }
    if (internalError instanceof CatalogDraftContractError) {
      return buildPublishContractErrorResponse(internalError);
    }
    const message = getErrorMessage(internalError);
    return NextResponse.json({ ok: false, error: "internal_error", reason: message }, { status: 500 });
  } finally {
    if (cloudSyncLock) {
      await releaseCloudSyncLock(cloudSyncLock);
    }
  }
}
