import { NextResponse } from "next/server";

import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import {
  buildDisplaySyncGuidance,
  isDeployHookConfigured,
  isDeployHookRequired,
  maybeTriggerXaBDeploy,
  readDeployPendingState,
  reconcileDeployPendingState,
} from "../../../../lib/deployHook";
import { getRequestIp, rateLimit, withRateHeaders } from "../../../../lib/rateLimit";
import { getUploaderKv } from "../../../../lib/syncMutex";
import { hasUploaderSession, timingSafeEqual } from "../../../../lib/uploaderAuth";
import { XA_UPLOADER_DEPLOY_DRAIN_TOKEN_ENV } from "../../../../lib/uploaderRuntimeConfig";

export const runtime = "nodejs";

const DEPLOY_DRAIN_WINDOW_MS = 60 * 1000;
const DEPLOY_DRAIN_MAX_REQUESTS = 30;


function extractBearerToken(request: Request): string {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

function hasDeployDrainToken(request: Request): boolean {
  const configured = (process.env[XA_UPLOADER_DEPLOY_DRAIN_TOKEN_ENV] ?? "").trim();
  if (!configured) return false;
  const provided = extractBearerToken(request);
  if (!provided) return false;
  return timingSafeEqual(provided, configured);
}

function buildDeployHookUnconfiguredResponse(storefrontId: string): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      storefront: storefrontId,
      error: "deploy_hook_unconfigured",
      recovery: "configure_deploy_hook",
    },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  if (process.env.XA_UPLOADER_MODE === "vendor") {
    rateLimit({
      key: `xa-uploader-deploy-drain-vendor:${requestIp}`,
      windowMs: DEPLOY_DRAIN_WINDOW_MS,
      max: DEPLOY_DRAIN_MAX_REQUESTS,
    });
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const authenticated = await hasUploaderSession(request).catch(() => false);
  if (!authenticated && !hasDeployDrainToken(request)) {
    // Consume unauthenticated probe budget without leaking endpoint shape via rate-limit headers.
    rateLimit({
      key: `xa-uploader-deploy-drain-unauth:${requestIp}`,
      windowMs: DEPLOY_DRAIN_WINDOW_MS,
      max: DEPLOY_DRAIN_MAX_REQUESTS,
    });
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const limit = rateLimit({
    key: `xa-uploader-deploy-drain:${requestIp}`,
    windowMs: DEPLOY_DRAIN_WINDOW_MS,
    max: DEPLOY_DRAIN_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "rate_limited", reason: "deploy_drain_rate_limited" },
        { status: 429 },
      ),
      limit,
    );
  }

  const storefront = new URL(request.url).searchParams.get("storefront");
  const storefrontId = parseStorefront(storefront);
  const kv = await getUploaderKv();
  const statePaths = undefined;

  const pendingBefore = await readDeployPendingState({
    storefrontId,
    kv,
    statePath: statePaths?.pendingStatePath,
  }).catch(() => null);

  if (!pendingBefore) {
    return withRateHeaders(
      NextResponse.json({
        ok: true,
        storefront: storefrontId,
        status: "idle_no_pending",
      }),
      limit,
    );
  }

  if (isDeployHookRequired() && !isDeployHookConfigured()) {
    return withRateHeaders(buildDeployHookUnconfiguredResponse(storefrontId), limit);
  }

  const deploy = await maybeTriggerXaBDeploy({
    storefrontId,
    kv,
    statePaths,
  });
  const pending = await reconcileDeployPendingState({
    storefrontId,
    kv,
    result: deploy,
    statePaths,
  }).catch(() => pendingBefore);

  return withRateHeaders(
    NextResponse.json({
      ok: true,
      storefront: storefrontId,
      status: deploy.status === "triggered" ? "triggered" : "pending",
      deploy,
      pending: pending ?? undefined,
      display: buildDisplaySyncGuidance(deploy, pending),
    }),
    limit,
  );
}
