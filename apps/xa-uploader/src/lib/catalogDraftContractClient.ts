import crypto from "node:crypto";

import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  slugify,
} from "@acme/lib/xa";

import type { XaCatalogStorefront } from "./catalogStorefront.types";

export class CatalogDraftContractError extends Error {
  readonly code: "unconfigured" | "request_failed" | "invalid_response" | "conflict";
  readonly status?: number;

  constructor(
    code: "unconfigured" | "request_failed" | "invalid_response" | "conflict",
    message: string,
    options?: { status?: number },
  ) {
    super(message);
    this.name = "CatalogDraftContractError";
    this.code = code;
    this.status = options?.status;
  }
}

export type CloudDraftSnapshot = {
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
  docRevision: string | null;
};

export class CatalogDraftConflictError extends Error {
  override name = "CatalogDraftConflictError";
}

function getCatalogContractBaseUrl(): string {
  return (process.env.XA_CATALOG_CONTRACT_BASE_URL ?? "").trim();
}

function getCatalogContractWriteToken(): string {
  return (process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN ?? "").trim();
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveContractRoot(baseUrl: string): URL {
  const base = new URL(ensureTrailingSlash(baseUrl));
  if (base.pathname.endsWith("/catalog/")) {
    base.pathname = base.pathname.slice(0, -"catalog/".length);
  } else if (base.pathname.endsWith("/catalog")) {
    base.pathname = `${base.pathname.slice(0, -"catalog".length)}/`;
  }
  return base;
}

function resolveDraftUrl(storefront: XaCatalogStorefront): string {
  const baseUrl = getCatalogContractBaseUrl();
  if (!baseUrl) {
    throw new CatalogDraftContractError("unconfigured", "XA_CATALOG_CONTRACT_BASE_URL is not configured.");
  }

  let root: URL;
  try {
    root = resolveContractRoot(baseUrl);
  } catch {
    throw new CatalogDraftContractError("unconfigured", "XA_CATALOG_CONTRACT_BASE_URL is not a valid URL.");
  }
  return new URL(`drafts/${encodeURIComponent(storefront)}`, root).toString();
}

function getWriteTokenHeader(): Record<string, string> {
  const writeToken = getCatalogContractWriteToken();
  if (!writeToken) {
    throw new CatalogDraftContractError("unconfigured", "XA_CATALOG_CONTRACT_WRITE_TOKEN is not configured.");
  }
  return { "X-XA-Catalog-Token": writeToken };
}

function parseSnapshotPayload(payload: unknown): CloudDraftSnapshot {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CatalogDraftContractError("invalid_response", "Draft contract returned invalid payload.");
  }
  const record = payload as {
    products?: unknown;
    revisionsById?: unknown;
    docRevision?: unknown;
  };

  const products = Array.isArray(record.products)
    ? (record.products as CatalogProductDraftInput[])
    : [];

  const revisionsById =
    record.revisionsById && typeof record.revisionsById === "object" && !Array.isArray(record.revisionsById)
      ? (record.revisionsById as Record<string, string>)
      : {};

  const docRevision =
    typeof record.docRevision === "string" && record.docRevision.trim()
      ? record.docRevision.trim()
      : null;

  return { products, revisionsById, docRevision };
}

function createRevision(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function readCloudDraftSnapshot(
  storefront: XaCatalogStorefront,
): Promise<CloudDraftSnapshot> {
  const url = resolveDraftUrl(storefront);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...getWriteTokenHeader(),
    },
  });

  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to read draft contract snapshot.", {
      status: response.status,
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
  const response = await fetch(url, {
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
    });
  }
  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to write draft contract snapshot.", {
      status: response.status,
    });
  }

  const payload = (await response.json().catch(() => null)) as {
    docRevision?: unknown;
  } | null;

  const docRevision =
    payload && typeof payload.docRevision === "string" && payload.docRevision.trim()
      ? payload.docRevision.trim()
      : null;

  return { docRevision };
}

export async function deleteCloudDraftSnapshot(
  storefront: XaCatalogStorefront,
): Promise<void> {
  const url = resolveDraftUrl(storefront);
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      ...getWriteTokenHeader(),
    },
  });

  if (!response.ok) {
    throw new CatalogDraftContractError("request_failed", "Failed to delete draft contract snapshot.", {
      status: response.status,
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
  const normalizedSlug = slugify(parsed.slug || parsed.title);
  if (!normalizedSlug) {
    throw new Error("Product id \"\" is invalid.");
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
    return slugify(entry.slug || entry.title) === normalizedSlug;
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
    (entry) => slugify(entry.slug || entry.title) === normalizedSlug,
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
