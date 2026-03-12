import crypto from "node:crypto";

import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  slugify,
  withAutoCatalogDraftFields,
} from "@acme/lib/xa";

import { buildCatalogContractUrl } from "./catalogContractUtils";
import type { XaCatalogStorefront } from "./catalogStorefront.types";
import { type CurrencyRates,parseCurrencyRatesOrNull } from "./currencyRates";
import { isRecord } from "./typeGuards";
import { uploaderLog } from "./uploaderLogger";

export interface CatalogContractServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare global {
  interface CloudflareEnv {
    XA_CATALOG_CONTRACT_SERVICE?: CatalogContractServiceBinding;
  }
}

export class CatalogDraftContractError extends Error {
  readonly code: "unconfigured" | "request_failed" | "invalid_response" | "conflict";
  readonly status?: number;
  readonly endpoint?: string;

  constructor(
    code: "unconfigured" | "request_failed" | "invalid_response" | "conflict",
    message: string,
    options?: { status?: number; endpoint?: string },
  ) {
    super(message);
    this.name = "CatalogDraftContractError";
    this.code = code;
    this.status = options?.status;
    this.endpoint = options?.endpoint;
  }
}

export type CloudDraftSnapshot = {
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
  docRevision: string | null;
};

export type CloudSyncLockLease = {
  storefront: XaCatalogStorefront;
  ownerToken: string;
  expiresAt: string | null;
};

export class CatalogDraftConflictError extends Error {
  override name = "CatalogDraftConflictError";
}

function getCatalogContractWriteToken(): string {
  return (process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN ?? "").trim();
}

function getCatalogContractReadToken(): string {
  return (process.env.XA_CATALOG_CONTRACT_READ_TOKEN ?? "").trim();
}


function buildContractUrl(pathname: string): string {
  return buildCatalogContractUrl(pathname, (reason) =>
    new CatalogDraftContractError(
      "unconfigured",
      reason === "missing"
        ? "XA_CATALOG_CONTRACT_BASE_URL is not configured."
        : "XA_CATALOG_CONTRACT_BASE_URL is not a valid URL.",
    ),
  );
}

function buildDraftUrl(storefront: XaCatalogStorefront, suffix = ""): string {
  return buildContractUrl(`drafts/${encodeURIComponent(storefront)}${suffix}`);
}

function resolveDraftUrl(storefront: XaCatalogStorefront): string {
  return buildDraftUrl(storefront);
}

function resolveDraftSyncLockUrl(storefront: XaCatalogStorefront): string {
  return buildDraftUrl(storefront, "/sync-lock");
}

function resolveCurrencyRatesUrl(storefront: XaCatalogStorefront): string {
  return buildContractUrl(`currency-rates/${encodeURIComponent(storefront)}`);
}

function getWriteTokenHeader(): Record<string, string> {
  const writeToken = getCatalogContractWriteToken();
  if (!writeToken) {
    throw new CatalogDraftContractError("unconfigured", "XA_CATALOG_CONTRACT_WRITE_TOKEN is not configured.");
  }
  return { "X-XA-Catalog-Token": writeToken };
}

function getReadTokenHeader(): Record<string, string> {
  const readToken = getCatalogContractReadToken();
  if (readToken) {
    return { "X-XA-Catalog-Token": readToken };
  }

  const writeToken = getCatalogContractWriteToken();
  if (writeToken) {
    return { "X-XA-Catalog-Token": writeToken };
  }

  throw new CatalogDraftContractError(
    "unconfigured",
    "XA_CATALOG_CONTRACT_READ_TOKEN or XA_CATALOG_CONTRACT_WRITE_TOKEN is not configured.",
  );
}

function parseSnapshotPayload(payload: unknown): CloudDraftSnapshot {
  if (!isRecord(payload)) {
    throw new CatalogDraftContractError("invalid_response", "Draft contract returned invalid payload.");
  }
  const record = payload as {
    products?: unknown;
    revisionsById?: unknown;
    docRevision?: unknown;
  };

  const products: CatalogProductDraftInput[] = [];
  if (record.products !== undefined) {
    if (!Array.isArray(record.products)) {
      throw new CatalogDraftContractError(
        "invalid_response",
        "Draft contract returned invalid products payload.",
      );
    }

    for (const entry of record.products) {
      const parsed = catalogProductDraftSchema.safeParse(withAutoCatalogDraftFields(entry as CatalogProductDraftInput));
      if (parsed.success) {
        products.push(parsed.data);
      }
    }
  }

  const revisionsById: Record<string, string> = {};
  if (record.revisionsById !== undefined) {
    if (
      !record.revisionsById ||
      typeof record.revisionsById !== "object" ||
      Array.isArray(record.revisionsById)
    ) {
      throw new CatalogDraftContractError(
        "invalid_response",
        "Draft contract returned invalid revisionsById payload.",
      );
    }

    for (const [key, value] of Object.entries(record.revisionsById)) {
      const normalizedKey = key.trim();
      const normalizedValue = typeof value === "string" ? value.trim() : "";
      if (!normalizedKey || !normalizedValue) {
        throw new CatalogDraftContractError(
          "invalid_response",
          "Draft contract returned invalid revision entry.",
        );
      }
      revisionsById[normalizedKey] = normalizedValue;
    }
  }

  const docRevision =
    typeof record.docRevision === "string" && record.docRevision.trim()
      ? record.docRevision.trim()
      : null;

  return { products, revisionsById, docRevision };
}

function parseOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseCurrencyRatesPayload(payload: unknown): CurrencyRates | null {
  if (!isRecord(payload)) {
    throw new CatalogDraftContractError("invalid_response", "Currency rates contract returned invalid payload.");
  }

  if (payload.rates === null) {
    return null;
  }

  const rates = parseCurrencyRatesOrNull(payload.rates);
  if (!rates) {
    throw new CatalogDraftContractError(
      "invalid_response",
      "Currency rates contract returned invalid rates payload.",
    );
  }

  return rates;
}

function createRevision(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

function getProductNormalizedSlug(product: Pick<CatalogProductDraftInput, "slug" | "title">): string {
  return slugify(product.slug || product.title);
}

function sanitizeContractEndpoint(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "invalid_contract_url";
  }
}

function asServiceBindingRequestUrl(value: string): string {
  const parsed = new URL(value);
  return `https://catalog-contract.internal${parsed.pathname}${parsed.search}`;
}

async function getCatalogContractServiceBinding(): Promise<CatalogContractServiceBinding | null> {
  const allowCloudflareContextInTests = process.env.XA_TEST_ENABLE_CLOUDFLARE_CONTEXT === "1";
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

async function requestCatalogContract(url: string, init: RequestInit): Promise<Response> {
  const serviceBinding = await getCatalogContractServiceBinding();
  if (serviceBinding) {
    return serviceBinding.fetch(asServiceBindingRequestUrl(url), init);
  }
  return fetch(url, init);
}

export async function readCloudDraftSnapshot(
  storefront: XaCatalogStorefront,
): Promise<CloudDraftSnapshot> {
  const url = resolveDraftUrl(storefront);
  const response = await requestCatalogContract(url, {
    method: "GET",
    headers: {
      ...getReadTokenHeader(),
    },
  });

  if (!response.ok) {
    uploaderLog("error", "read_snapshot_error", { storefront, code: "request_failed", httpStatus: response.status });
    throw new CatalogDraftContractError("request_failed", "Failed to read draft contract snapshot.", {
      status: response.status,
      endpoint: sanitizeContractEndpoint(url),
    });
  }

  const payload = await response.json().catch(() => null);
  return parseSnapshotPayload(payload);
}

export async function writeCloudDraftSnapshot(params: {
  storefront: XaCatalogStorefront;
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
  ifMatchDocRevision?: string | null;
}): Promise<{ docRevision: string | null }> {
  const url = resolveDraftUrl(params.storefront);
  const response = await requestCatalogContract(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getWriteTokenHeader(),
    },
    body: JSON.stringify({
      storefront: params.storefront,
      products: params.products,
      revisionsById: params.revisionsById,
      ifMatchDocRevision: params.ifMatchDocRevision ?? undefined,
    }),
  });

  if (response.status === 409) {
    throw new CatalogDraftContractError("conflict", "Draft snapshot revision conflict.", {
      status: 409,
      endpoint: sanitizeContractEndpoint(url),
    });
  }
  if (!response.ok) {
    uploaderLog("error", "write_snapshot_error", { storefront: params.storefront, httpStatus: response.status });
    throw new CatalogDraftContractError("request_failed", "Failed to write draft contract snapshot.", {
      status: response.status,
      endpoint: sanitizeContractEndpoint(url),
    });
  }

  const raw: unknown = await response.json().catch(() => null);
  const payload = isRecord(raw) ? raw : null;

  const docRevision =
    payload && typeof payload.docRevision === "string" && payload.docRevision.trim()
      ? payload.docRevision.trim()
      : null;

  return { docRevision };
}

export async function acquireCloudSyncLock(
  storefront: XaCatalogStorefront,
): Promise<
  | { status: "acquired"; lock: CloudSyncLockLease }
  | { status: "busy"; expiresAt: string | null }
> {
  const url = resolveDraftSyncLockUrl(storefront);
  const response = await requestCatalogContract(url, {
    method: "POST",
    headers: {
      ...getWriteTokenHeader(),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ownerToken?: unknown;
        expiresAt?: unknown;
      }
    | null;

  if (response.status === 409) {
    uploaderLog("warn", "sync_lock_failed", { storefront, code: "busy" });
    return {
      status: "busy",
      expiresAt: parseOptionalString(payload?.expiresAt),
    };
  }

  if (!response.ok) {
    throw new CatalogDraftContractError(
      response.status === 503 ? "unconfigured" : "request_failed",
      "Failed to acquire sync lock.",
      {
        status: response.status,
        endpoint: sanitizeContractEndpoint(url),
      },
    );
  }

  const ownerToken = parseOptionalString(payload?.ownerToken);
  if (!ownerToken) {
    throw new CatalogDraftContractError(
      "invalid_response",
      "Sync lock endpoint returned invalid owner token.",
      { endpoint: sanitizeContractEndpoint(url) },
    );
  }

  return {
    status: "acquired",
    lock: {
      storefront,
      ownerToken,
      expiresAt: parseOptionalString(payload?.expiresAt),
    },
  };
}

export async function releaseCloudSyncLock(lock: CloudSyncLockLease): Promise<void> {
  const url = resolveDraftSyncLockUrl(lock.storefront);
  const response = await requestCatalogContract(url, {
    method: "DELETE",
    headers: {
      ...getWriteTokenHeader(),
      "X-XA-Sync-Lock-Owner": lock.ownerToken,
    },
  });

  if (response.status === 404 || response.status === 409) {
    return;
  }

  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to release sync lock.", {
      status: response.status,
      endpoint: sanitizeContractEndpoint(url),
    });
  }
}

export async function deleteCloudDraftSnapshot(
  storefront: XaCatalogStorefront,
): Promise<void> {
  const url = resolveDraftUrl(storefront);
  const response = await requestCatalogContract(url, {
    method: "DELETE",
    headers: {
      ...getWriteTokenHeader(),
    },
  });

  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to delete draft contract snapshot.", {
      status: response.status,
      endpoint: sanitizeContractEndpoint(url),
    });
  }
}

export async function readCloudCurrencyRates(
  storefront: XaCatalogStorefront,
): Promise<CurrencyRates | null> {
  const url = resolveCurrencyRatesUrl(storefront);
  const response = await requestCatalogContract(url, {
    method: "GET",
    headers: {
      ...getReadTokenHeader(),
    },
  });

  const payload = await response.json().catch(() => null);
  if (response.status === 409) {
    throw new CatalogDraftContractError("invalid_response", "Stored currency rates are invalid.", {
      status: 409,
      endpoint: sanitizeContractEndpoint(url),
    });
  }
  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to read currency rates contract.", {
      status: response.status,
      endpoint: sanitizeContractEndpoint(url),
    });
  }

  return parseCurrencyRatesPayload(payload);
}

export async function writeCloudCurrencyRates(params: {
  storefront: XaCatalogStorefront;
  rates: CurrencyRates;
}): Promise<void> {
  const url = resolveCurrencyRatesUrl(params.storefront);
  const response = await requestCatalogContract(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getWriteTokenHeader(),
    },
    body: JSON.stringify({
      storefront: params.storefront,
      rates: params.rates,
    }),
  });

  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to write currency rates contract.", {
      status: response.status,
      endpoint: sanitizeContractEndpoint(url),
    });
  }
}

export function upsertProductInCloudSnapshot(params: {
  product: CatalogProductDraftInput;
  ifMatch?: string;
  snapshot: CloudDraftSnapshot;
}): {
  product: CatalogProductDraftInput;
  revision: string;
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
} {
  const parsed = catalogProductDraftSchema.parse(params.product);
  const normalizedSlug = getProductNormalizedSlug(parsed);
  if (!normalizedSlug) {
    throw new Error("Could not derive a valid product slug from the provided title or slug field.");
  }

  const id = (parsed.id ?? "").trim() || crypto.randomUUID();
  const nextProduct: CatalogProductDraftInput = {
    ...parsed,
    id,
    slug: normalizedSlug,
  };

  const products = [...params.snapshot.products];
  const revisionsById = { ...params.snapshot.revisionsById };
  const existingIndex = products.findIndex((entry) => (entry.id ?? "").trim() === id);

  const duplicateSlug = products.some((entry, index) => {
    if (index === existingIndex) return false;
    return getProductNormalizedSlug(entry) === normalizedSlug;
  });
  if (duplicateSlug) {
    throw new Error(`Duplicate product slug "${normalizedSlug}".`);
  }

  const currentRevision = revisionsById[id];
  if (params.ifMatch !== undefined && params.ifMatch !== currentRevision) {
    throw new CatalogDraftConflictError("revision_conflict");
  }

  if (existingIndex >= 0) {
    products[existingIndex] = nextProduct;
  } else {
    products.push(nextProduct);
  }

  const revision = createRevision();
  revisionsById[id] = revision;

  return {
    product: nextProduct,
    revision,
    products,
    revisionsById,
  };
}

export function upsertProductsInCloudSnapshot(params: {
  products: CatalogProductDraftInput[];
  snapshot: CloudDraftSnapshot;
}): { products: CatalogProductDraftInput[]; revisionsById: Record<string, string> } {
  const nextProducts = [...params.snapshot.products];
  const nextRevisions = { ...params.snapshot.revisionsById };

  const idToIndex = new Map<string, number>();
  const slugToIndex = new Map<string, number>();
  for (const [i, p] of nextProducts.entries()) {
    const pid = (p.id ?? "").trim();
    if (pid) idToIndex.set(pid, i);
    const slug = getProductNormalizedSlug(p);
    if (slug) slugToIndex.set(slug, i);
  }

  for (const input of params.products) {
    const parsed = catalogProductDraftSchema.parse(input);
    const normalizedSlug = getProductNormalizedSlug(parsed);
    if (!normalizedSlug) {
      throw new Error(`Product "${parsed.id ?? ""}" has an invalid slug.`);
    }

    const id = (parsed.id ?? "").trim() || crypto.randomUUID();
    const nextProduct: CatalogProductDraftInput = { ...parsed, id, slug: normalizedSlug };

    const existingIndex = idToIndex.get(id) ?? -1;
    const slugIndex = slugToIndex.get(normalizedSlug) ?? -1;
    if (slugIndex >= 0 && slugIndex !== existingIndex) {
      throw new Error(`Duplicate product slug "${normalizedSlug}".`);
    }

    if (existingIndex >= 0) {
      nextProducts[existingIndex] = nextProduct;
    } else {
      nextProducts.push(nextProduct);
      idToIndex.set(id, nextProducts.length - 1);
    }
    slugToIndex.set(normalizedSlug, existingIndex >= 0 ? existingIndex : nextProducts.length - 1);
    nextRevisions[id] = createRevision();
  }

  return { products: nextProducts, revisionsById: nextRevisions };
}

export function deleteProductFromCloudSnapshot(params: {
  slug: string;
  snapshot: CloudDraftSnapshot;
}): {
  deleted: boolean;
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
} {
  const normalizedSlug = slugify(params.slug);
  const products = [...params.snapshot.products];
  const index = products.findIndex(
    (entry) => getProductNormalizedSlug(entry) === normalizedSlug,
  );

  if (index < 0) {
    return {
      deleted: false,
      products: params.snapshot.products,
      revisionsById: params.snapshot.revisionsById,
    };
  }

  const [removed] = products.splice(index, 1);
  const revisionsById = { ...params.snapshot.revisionsById };
  const removedId = (removed?.id ?? "").trim();
  if (removedId) {
    delete revisionsById[removedId];
  }

  return { deleted: true, products, revisionsById };
}
