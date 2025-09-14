// apps/cms/src/actions/updateProduct.ts
"use server";

import { LOCALES } from "@acme/i18n";
import { ProductPublication } from "@platform-core/products";
import {
  getProductById,
  updateProductInRepo,
} from "@platform-core/repositories/json.server";
import type { Locale } from "@acme/types";

/**
 * Server Action: patch an existing product (optimistic locking).
 *
 * Phase-0 assumption:
 *   – always operate on shop "bcd" (hard-coded here);
 *   – multi-store routing / RBAC will replace this constant later.
 */
export async function updateProduct(
  formData: FormData
): Promise<ProductPublication> {
  const SHOP = "bcd"; // ↞ align with ProductEditPage

  /* ------------------------------------------------------------------ */
  /*  Load current snapshot                                             */
  /* ------------------------------------------------------------------ */
  const id = String(formData.get("id"));
  const current = await getProductById<ProductPublication>(SHOP, id);
  if (!current) throw new Error(`Product ${id} not found in shop ${SHOP}`);

  /* ------------------------------------------------------------------ */
  /*  Merge patch                                                       */
  /* ------------------------------------------------------------------ */
  const title = { ...current.title };
  LOCALES.forEach((l) => {
    const v = formData.get(`title_${l}`);
    if (typeof v === "string") title[l as Locale] = v;
  });
  const rawPrice = formData.get("price");
  const price =
    typeof rawPrice === "string" && rawPrice.trim() !== ""
      ? Number(rawPrice)
      : 0;

  const updated: ProductPublication = {
    ...current,
    title,
    price,
    row_version: (current.row_version ?? 0) + 1,
  };

  /* ------------------------------------------------------------------ */
  /*  Persist atomically & return freshly stored record                 */
  /* ------------------------------------------------------------------ */
  return updateProductInRepo<ProductPublication>(SHOP, updated);
}
