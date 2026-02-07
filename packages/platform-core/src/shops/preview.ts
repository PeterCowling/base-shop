// packages/platform-core/src/shops/preview.ts

import { coreEnv } from "@acme/config/env/core";
import type { Environment } from "@acme/types";

import { createPreviewToken, createUpgradePreviewToken } from "../previewTokens";

import { readDeployInfo } from "./deployInfo";

type PreviewSource = "stage" | "preview" | "url" | "env" | "local" | "unknown";

function tryParseUrl(value: string | undefined | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function resolvePreviewBaseUrl({
  shopId,
  preferEnv = ["stage", "dev", "prod"],
}: {
  shopId: string;
  preferEnv?: Environment[];
}): { baseUrl: URL | null; source: PreviewSource } {
  const info = readDeployInfo(shopId);

  // Prefer Stage when available, then env-preferred, then generic preview/url, then env fallback, then local.
  const candidates: { raw: string | undefined; source: PreviewSource }[] = [];

  if (info) {
    const env = info.env as Environment | undefined;
    const isStage = env === "stage";
    const stageCandidate = isStage ? info.previewUrl ?? info.url : undefined;
    if (stageCandidate) {
      candidates.push({ raw: stageCandidate, source: "stage" });
    }

    // If a specific env is preferred and matches the recorded env, keep that early in the list.
    const preferredMatch =
      env && preferEnv.includes(env) ? info.previewUrl ?? info.url : undefined;
    if (preferredMatch && !isStage) {
      candidates.push({ raw: preferredMatch, source: isStage ? "stage" : "url" });
    }

    if (info.previewUrl) {
      candidates.push({ raw: info.previewUrl, source: isStage ? "stage" : "preview" });
    }
    if (info.url) {
      candidates.push({ raw: info.url, source: isStage ? "stage" : "url" });
    }
  }

  if (coreEnv.NEXT_PUBLIC_BASE_URL) {
    candidates.push({ raw: coreEnv.NEXT_PUBLIC_BASE_URL, source: "env" });
  }

  // Local dev fallback: template app defaults to 3000
  candidates.push({ raw: "http://localhost:3000", source: "local" });

  for (const candidate of candidates) {
    const parsed = tryParseUrl(candidate.raw);
    if (parsed) return { baseUrl: parsed, source: candidate.source };
  }

  return { baseUrl: null, source: "unknown" };
}

export function buildPagePreview({
  shopId,
  pageId,
  preferEnv = ["stage", "dev", "prod"],
  tokenType = "preview",
}: {
  shopId: string;
  pageId: string;
  preferEnv?: Environment[];
  tokenType?: "preview" | "upgrade";
}): { url: string | null; token: string | null; source: PreviewSource; tokenType: "preview" | "upgrade" | null } {
  const { baseUrl, source } = resolvePreviewBaseUrl({ shopId, preferEnv });
  const secret =
    tokenType === "upgrade" ? coreEnv.UPGRADE_PREVIEW_TOKEN_SECRET : coreEnv.PREVIEW_TOKEN_SECRET;
  const token = secret
    ? tokenType === "upgrade"
      ? createUpgradePreviewToken({ shopId, pageId }, secret)
      : createPreviewToken({ shopId, pageId }, secret)
    : null;

  if (!baseUrl) {
    return { url: null, token, source, tokenType: token ? tokenType : null };
  }

  const href = new URL(`/preview/${encodeURIComponent(pageId)}`, baseUrl);
  if (token) {
    const param = tokenType === "upgrade" ? "upgrade" : "token";
    href.searchParams.set(param, token);
  }

  return {
    url: href.toString(),
    token,
    source,
    tokenType: token ? tokenType : null,
  };
}
