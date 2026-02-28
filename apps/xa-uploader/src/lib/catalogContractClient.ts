import fs from "node:fs/promises";

import { toPositiveInt } from "@acme/lib";

import type { XaCatalogStorefront } from "./catalogStorefront.types";

type CatalogContractResponse = {
  ok?: boolean;
  version?: string;
  publishedAt?: string;
};

export type CatalogPublishResult = {
  version?: string;
  publishedAt?: string;
};

export class CatalogPublishError extends Error {
  readonly code: "unconfigured" | "invalid_payload" | "request_failed" | "invalid_response";
  readonly status?: number;
  readonly details?: string;

  constructor(
    code: "unconfigured" | "invalid_payload" | "request_failed" | "invalid_response",
    message: string,
    options?: { status?: number; details?: string },
  ) {
    super(message);
    this.name = "CatalogPublishError";
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

function getCatalogContractBaseUrl(): string {
  return (process.env.XA_CATALOG_CONTRACT_BASE_URL ?? "").trim();
}

function getCatalogContractWriteToken(): string {
  return (process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN ?? "").trim();
}

export function getCatalogContractReadiness(): { configured: boolean; errors: string[] } {
  const errors: string[] = [];
  // i18n-exempt -- XAUP-118 [ttl=2026-12-31] non-UI diagnostics for readiness payload
  if (!getCatalogContractBaseUrl()) errors.push("XA_CATALOG_CONTRACT_BASE_URL not set");
  // i18n-exempt -- XAUP-118 [ttl=2026-12-31] non-UI diagnostics for readiness payload
  if (!getCatalogContractWriteToken()) errors.push("XA_CATALOG_CONTRACT_WRITE_TOKEN not set");
  return { configured: errors.length === 0, errors };
}

function getCatalogContractTimeoutMs(): number {
  return toPositiveInt(process.env.XA_CATALOG_CONTRACT_TIMEOUT_MS, 20_000, 1);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function buildCatalogContractPublishUrl(storefrontId: XaCatalogStorefront): string {
  const baseUrl = getCatalogContractBaseUrl();
  if (!baseUrl) {
    throw new CatalogPublishError(
      "unconfigured",
      "XA_CATALOG_CONTRACT_BASE_URL is not configured.",
    );
  }

  try {
    return new URL(encodeURIComponent(storefrontId), ensureTrailingSlash(baseUrl)).toString();
  } catch {
    throw new CatalogPublishError(
      "unconfigured",
      "XA_CATALOG_CONTRACT_BASE_URL is not a valid URL.",
    );
  }
}

function parseCatalogJson(raw: string, sourcePath: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new CatalogPublishError(
      "invalid_payload",
      `Catalog artifact is not valid JSON: ${sourcePath}`,
    );
  }
}

export async function publishCatalogArtifactsToContract(params: {
  storefrontId: XaCatalogStorefront;
  catalogOutPath: string;
  mediaOutPath: string;
}): Promise<CatalogPublishResult> {
  const writeToken = getCatalogContractWriteToken();
  if (!writeToken) {
    throw new CatalogPublishError(
      "unconfigured",
      "XA_CATALOG_CONTRACT_WRITE_TOKEN is not configured.",
    );
  }

  const publishUrl = buildCatalogContractPublishUrl(params.storefrontId);
  const [catalogRaw, mediaRaw] = await Promise.all([
    readFileUtf8(params.catalogOutPath),
    readFileUtf8(params.mediaOutPath),
  ]);

  const payload = {
    storefront: params.storefrontId,
    publishedAt: new Date().toISOString(),
    catalog: parseCatalogJson(catalogRaw, params.catalogOutPath),
    mediaIndex: parseCatalogJson(mediaRaw, params.mediaOutPath),
  };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), getCatalogContractTimeoutMs());

  let response: Response;
  try {
    response = await fetch(publishUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-XA-Catalog-Token": writeToken,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    // i18n-exempt -- XAUP-118 [ttl=2026-12-31]
    const message = error instanceof Error ? error.message : "catalog contract request failed";
    throw new CatalogPublishError("request_failed", message);
  } finally {
    clearTimeout(timeoutHandle);
  }

  const responseText = await response.text();
  if (!response.ok) {
    throw new CatalogPublishError("request_failed", "Catalog contract rejected publish request.", {
      status: response.status,
      details: responseText.slice(0, 2048),
    });
  }

  let parsed: CatalogContractResponse;
  try {
    parsed = responseText ? (JSON.parse(responseText) as CatalogContractResponse) : {};
  } catch {
    throw new CatalogPublishError(
      "invalid_response",
      "Catalog contract returned non-JSON response.",
    );
  }

  if (!parsed || parsed.ok !== true) {
    throw new CatalogPublishError(
      "invalid_response",
      "Catalog contract returned an invalid success payload.",
    );
  }

  return {
    version: typeof parsed.version === "string" ? parsed.version : undefined,
    publishedAt: typeof parsed.publishedAt === "string" ? parsed.publishedAt : undefined,
  };
}

async function readFileUtf8(filePath: string): Promise<string> {
  // Paths are produced by the XA uploader pipeline and stay within generated artifact directories.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- XAUP-118 controlled artifact path from server-side pipeline
  return fs.readFile(filePath, "utf8");
}
