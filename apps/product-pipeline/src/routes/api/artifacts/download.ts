/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/artifacts/download.ts

import type { PipelineEventContext } from "../_lib/types";
import { getEvidenceBucket, type PipelineEnv } from "../_lib/db";
import { errorResponse } from "../_lib/response";

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return errorResponse(400, "missing_key");
  }

  const bucket = getEvidenceBucket(env);
  const object = await bucket.get(key);
  if (!object || !object.body) {
    return errorResponse(404, "artifact_not_found", { key });
  }

  const headers = new Headers();
  if (object.httpMetadata?.contentType) {
    headers.set("Content-Type", object.httpMetadata.contentType);
  }
  headers.set("Cache-Control", "private, max-age=0");

  return new Response(object.body, { headers });
};
