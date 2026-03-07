import { NextResponse } from "next/server";

import { toPositiveInt } from "@acme/lib";

import type { buildCatalogArtifactsFromDrafts } from "./catalogDraftToContract";
import { getMediaBucket } from "./r2Media";

export type MediaValidationPolicy = "warn" | "strict";

export type CloudBuiltArtifacts = Awaited<ReturnType<typeof buildCatalogArtifactsFromDrafts>>;

const CLOUD_MEDIA_HEAD_MAX_KEYS_DEFAULT = 300;

export function getCloudMediaHeadMaxKeys(): number {
  return toPositiveInt(process.env.XA_UPLOADER_CLOUD_MEDIA_HEAD_MAX_KEYS, CLOUD_MEDIA_HEAD_MAX_KEYS_DEFAULT, 1);
}

export function isAbsoluteHttpUrl(pathValue: string): boolean {
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

export async function applyCloudMediaExistenceValidation(params: {
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
