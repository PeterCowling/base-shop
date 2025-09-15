// apps/cms/src/actions/products.ts
"use server";

import type { ProductForm } from "@cms/actions/schemas";
import { productSchema } from "@cms/actions/schemas";
import {
  deleteProductFromRepo,
  duplicateProductInRepo,
  getProductById,
  readRepo,
  readSettings,
  updateProductInRepo,
  writeRepo,
} from "@platform-core/repositories/json.server";
import { fillLocales } from "@i18n/fillLocales";
import { captureException } from "@/utils/sentry.server";
import type { Locale, ProductPublication, PublicationStatus } from "@acme/types";
import { ensureAuthorized } from "./common/auth";
import { redirect } from "next/navigation";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import { formDataToObject } from "../utils/formData";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function getLocales(shop: string): Promise<readonly Locale[]> {
  const settings = await readSettings(shop);
  return settings.languages;
}
/* -------------------------------------------------------------------------- */
/*  Create draft                                                               */
/* -------------------------------------------------------------------------- */
export async function createDraftRecord(
  shop: string
): Promise<ProductPublication> {
  await ensureAuthorized();

  const now = nowIso();
  const locales = await getLocales(shop);
  const first = locales[0] ?? "en";
  const title = fillLocales({ [first]: "Untitled" }, "");
  const description = fillLocales(undefined, "");

  const draft: ProductPublication = {
    id: ulid(),
    sku: `DRAFT-${Date.now()}`,
    title,
    description,
    price: 0,
    currency: "EUR",
    media: [],
    status: "draft",
    shop,
    row_version: 1,
    created_at: now,
    updated_at: now,
  };

  const repo = await readRepo<ProductPublication>(shop);
  await writeRepo<ProductPublication>(shop, [draft, ...repo]);
  return draft;
}

/* Server-action: called by “New product” button */
export async function createDraft(shop: string): Promise<void> {
  "use server";
  await ensureAuthorized();

  const draft = await createDraftRecord(shop);
  redirect(`/cms/shop/${shop}/products/${draft.id}/edit`);
}

/* -------------------------------------------------------------------------- */
/*  Update product                                                             */
/* -------------------------------------------------------------------------- */
export async function updateProduct(
  shop: string,
  formData: FormData
): Promise<{
  product?: ProductPublication;
  errors?: Record<string, string[]>;
}> {
  "use server";
  await ensureAuthorized();

  // Collect key/value pairs from the incoming form data. Use a helper that
  // supports environments where `FormData.entries()` may be unavailable.
  const formEntries = formDataToObject(formData);
  const locales = await getLocales(shop);
  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  locales.forEach((l) => {
    title[l] = String(formEntries[`title_${l}`] ?? "");
    description[l] = String(formEntries[`desc_${l}`] ?? "");
  });
  const media = (() => {
    try {
      return JSON.parse(String(formEntries.media ?? "[]"));
    } catch {
      return [];
    }
  })();

  const parsed = productSchema.safeParse({
    id: formEntries.id,
    price: formEntries.price,
    title,
    description,
    media,
  });
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    const productId = String(formData.get("id") ?? "");
    await captureException(parsed.error, { extra: { productId } });
    return { errors: fieldErrors as Record<string, string[]> };
  }

  const data: ProductForm = parsed.data;
  const { id, price, media: nextMedia } = data;
  const mediaItems = nextMedia.filter((m) => Boolean(m.url) && Boolean(m.type));
  const current = await getProductById(shop, id);
  if (!current) throw new Error(`Product ${id} not found in ${shop}`);

  const updated: ProductPublication = {
    ...current,
    title: { ...current.title, ...data.title },
    description: { ...current.description, ...data.description },
    price,
    media: mediaItems,
    row_version: current.row_version + 1,
    updated_at: nowIso(),
  };

  try {
    const saved = await updateProductInRepo<ProductPublication>(shop, updated);
    return { product: saved };
  } catch (error) {
    await captureException(error, { extra: { productId: id } });
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Duplicate product                                                          */
/* -------------------------------------------------------------------------- */
export async function duplicateProduct(
  shop: string,
  id: string
): Promise<void> {
  "use server";
  await ensureAuthorized();

  const copy = await duplicateProductInRepo<ProductPublication>(shop, id);
  redirect(`/cms/shop/${shop}/products/${copy.id}/edit`);
}

/* -------------------------------------------------------------------------- */
/*  Delete product                                                             */
/* -------------------------------------------------------------------------- */
export async function deleteProduct(shop: string, id: string): Promise<void> {
  "use server";
  await ensureAuthorized();

  await deleteProductFromRepo(shop, id);
  redirect(`/cms/shop/${shop}/products`);
}

/* -------------------------------------------------------------------------- */
/*  Approval queue                                                             */
/* -------------------------------------------------------------------------- */

const nextStatus: Record<PublicationStatus, PublicationStatus> = {
  draft: "review",
  review: "active",
  scheduled: "active",
  active: "active",
  archived: "archived",
};

export async function promoteProduct(
  shop: string,
  id: string
): Promise<ProductPublication> {
  "use server";
  await ensureAuthorized();

  const current = await getProductById<ProductPublication>(shop, id);
  if (!current) throw new Error(`Product ${id} not found in ${shop}`);

  const status = nextStatus[current.status];
  if (status === current.status) return current;

  const updated: ProductPublication = {
    ...current,
    status,
    updated_at: nowIso(),
  };

  return updateProductInRepo<ProductPublication>(shop, updated);
}
