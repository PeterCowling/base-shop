// apps/cms/src/actions/products.ts
"use server";

import type { ProductPublication } from "@platform-core/products";
import {
  getProductById,
  readRepo,
  updateProductInRepo,
  writeRepo,
} from "@platform-core/repositories/json";
import { redirect } from "next/navigation";
import { ulid } from "ulid";

/* -------------------------------------------------------------------------- */
/*  Create draft                                                              */
/* -------------------------------------------------------------------------- */
export async function createDraftRecord(
  shop: string
): Promise<ProductPublication> {
  const now = new Date().toISOString();
  const draft: ProductPublication = {
    id: ulid(),
    sku: `DRAFT-${Date.now()}`,
    title: { en: "Untitled" },
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

/**
 * Called by the “New product” form action.
 * After persisting the draft, redirect to its edit page.
 */
export async function createDraft(shop: string): Promise<void> {
  "use server";
  const draft = await createDraftRecord(shop);
  redirect(`/shop/${shop}/products/${draft.id}/edit`); /* ← /shop/… */
}

/* -------------------------------------------------------------------------- */
/*  Update product                                                            */
/* -------------------------------------------------------------------------- */
export async function updateProduct(
  shop: string,
  formData: FormData
): Promise<ProductPublication> {
  "use server";

  const id = String(formData.get("id"));
  const current = await getProductById(shop, id);
  if (!current) throw new Error(`Product ${id} not found in ${shop}`);

  const updated: ProductPublication = {
    ...current,
    title: { ...current.title, en: String(formData.get("title_en")) },
    price: Number(formData.get("price")),
    row_version: current.row_version + 1,
    updated_at: new Date().toISOString(),
  };

  return updateProductInRepo(shop, updated);
}
