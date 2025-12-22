/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/evidence/upload.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { getEvidenceBucket, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

const metadataSchema = z.object({
  laneVersionId: z.string().min(1),
  kind: z.string().min(1),
  filename: z.string().min(1).optional(),
});

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return safe || "evidence.bin";
}

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return errorResponse(400, "invalid_form_data");
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || !(file instanceof Blob)) {
    return errorResponse(400, "file_required");
  }

  const laneVersionIdValue = formData.get("laneVersionId");
  const kindValue = formData.get("kind");
  const filenameValue = formData.get("filename");

  const parsed = metadataSchema.safeParse({
    laneVersionId:
      typeof laneVersionIdValue === "string" ? laneVersionIdValue : "",
    kind: typeof kindValue === "string" ? kindValue : "",
    filename: typeof filenameValue === "string" ? filenameValue : undefined,
  });

  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const filenameFromFile =
    typeof file === "object" && "name" in file ? String(file.name) : null;
  const filename = sanitizeFilename(
    parsed.data.filename ?? filenameFromFile ?? "evidence.bin",
  );
  const safeKind = sanitizeFilename(parsed.data.kind);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `logistics/lane-versions/${parsed.data.laneVersionId}/${timestamp}-${safeKind}-${filename}`;

  const bucket = getEvidenceBucket(env);
  const contentType = file.type || "application/octet-stream";

  await bucket.put(key, file, {
    httpMetadata: { contentType },
    customMetadata: {
      laneVersionId: parsed.data.laneVersionId,
      kind: parsed.data.kind,
    },
  });

  return jsonResponse({
    ok: true,
    uri: `r2://product-pipeline-evidence/${key}`,
    key,
    contentType,
    size: file.size,
  });
};
