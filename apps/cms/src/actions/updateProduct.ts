// apps/cms/src/actions/updateProduct.ts
"use server";

import { ProductPublication } from "@platform-core/products";
import {
  getProductById,
  updateProductInRepo,
} from "@platform-core/repositories/json";

/**
 * Server Action: patch an existing product (optimistic locking).
 *
 * Phase-0 assumption:
 *   – always operate on shop "abc" (hard-coded here);
 *   – multi-store routing / RBAC will replace this constant later.
 */
export async function updateProduct(
  formData: FormData
): Promise<ProductPublication> {
  const SHOP = "abc"; // ↞ align with ProductEditPage

  /* ------------------------------------------------------------------ */
  /*  Load current snapshot                                             */
  /* ------------------------------------------------------------------ */
  const id = String(formData.get("id"));
  const current = await getProductById<ProductPublication>(SHOP, id);
  if (!current) throw new Error(`Product ${id} not found in shop ${SHOP}`);

  /* ------------------------------------------------------------------ */
  /*  Merge patch                                                       */
  /* ------------------------------------------------------------------ */
  const updated: ProductPublication = {
    ...current,
    title: { ...current.title, en: String(formData.get("title_en")) },
    price: Number(formData.get("price")),
    row_version: (current.row_version ?? 0) + 1,
  };

  /* ------------------------------------------------------------------ */
  /*  Persist atomically & return freshly stored record                 */
  /* ------------------------------------------------------------------ */
  return updateProductInRepo<ProductPublication>(SHOP, updated);
}
