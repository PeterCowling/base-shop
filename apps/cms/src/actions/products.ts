// apps/cms/src/actions/products.ts
"use server";

import type { Locale, ProductPublication } from "@platform-core/products";

import {
  getProductById,
  readRepo,
  updateProductInRepo,
  writeRepo,
} from "@platform-core/repositories/json";
import { redirect } from "next/navigation";
import { ulid } from "ulid";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const locales: Locale[] = ["en", "de", "it"];

/* -------------------------------------------------------------------------- */
/*  Create draft                                                               */
/* -------------------------------------------------------------------------- */
export async function createDraftRecord(
  shop: string
): Promise<ProductPublication> {
  const now = new Date().toISOString();
  const blank = { en: "", de: "", it: "" };

  const draft: ProductPublication = {
    id: ulid(),
    sku: `DRAFT-${Date.now()}`,
    title: { ...blank, en: "Untitled" },
    description: blank,
    price: 0,
    currency: "EUR",
    images: [],
    status: "draft",
    shop,
    row_version: 1,
    created_at: now,
    updated_at: now,
  };

  const repo = await readRepo(shop);
  await writeRepo(shop, [draft, ...repo]);
  return draft;
}

/* Server-action: called by “New product” button */
export async function createDraft(shop: string): Promise<void> {
  "use server";
  const draft = await createDraftRecord(shop);
  redirect(`/shop/${shop}/products/${draft.id}/edit`);
}

/* -------------------------------------------------------------------------- */
/*  Update product                                                             */
/* -------------------------------------------------------------------------- */
export async function updateProduct(
  shop: string,
  formData: FormData
): Promise<ProductPublication> {
  "use server";

  const id = String(formData.get("id"));
  const current = await getProductById(shop, id);
  if (!current) throw new Error(`Product ${id} not found in ${shop}`);

  const nextTitle = { ...current.title };
  const nextDesc = { ...current.description };

  locales.forEach((l) => {
    const t = formData.get(`title_${l}`);
    const d = formData.get(`desc_${l}`);
    if (typeof t === "string") nextTitle[l] = t;
    if (typeof d === "string") nextDesc[l] = d;
  });

  const updated: ProductPublication = {
    ...current,
    title: nextTitle,
    description: nextDesc,
    price: Number(formData.get("price")),
    row_version: current.row_version + 1,
    updated_at: new Date().toISOString(),
  };

  return updateProductInRepo(shop, updated);
}
