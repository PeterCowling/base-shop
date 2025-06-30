// apps/cms/src/actions/products.ts
"use server";

import type { ProductForm } from "@cms/actions/schemas.server";
import { productSchema } from "@cms/actions/schemas.server";
import { authOptions } from "@cms/auth/options";
import type { ProductPublication } from "@platform-core/products";
import {
  deleteProductFromRepo,
  duplicateProductInRepo,
  getProductById,
  readRepo,
  readSettings,
  updateProductInRepo,
  writeRepo,
} from "@platform-core/repositories/json.server";
import type { Locale } from "@types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ulid } from "ulid";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "viewer") {
    throw new Error("Forbidden");
  }
}

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

  const now = new Date().toISOString();
  const locales = await getLocales(shop);
  const blank: Record<string, string> = {};
  locales.forEach((l) => {
    blank[l] = "";
  });
  const first = locales[0] ?? "en";
  const title = { ...blank, [first]: "Untitled" } as Record<Locale, string>;
  const description = { ...blank } as Record<Locale, string>;

  const draft: ProductPublication = {
    id: ulid(),
    sku: `DRAFT-${Date.now()}`,
    title,
    description,
    price: 0,
    currency: "EUR",
    images: [],
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

  const parsed = productSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data: ProductForm = parsed.data;
  const { id, price } = data;
  const current = await getProductById(shop, id);
  if (!current) throw new Error(`Product ${id} not found in ${shop}`);

  const nextTitle = { ...current.title };
  const nextDesc = { ...current.description };

  const locales = await getLocales(shop);

  locales.forEach((l) => {
    const t = data[`title_${l}` as keyof ProductForm];
    const d = data[`desc_${l}` as keyof ProductForm];
    if (typeof t === "string") nextTitle[l] = t;
    if (typeof d === "string") nextDesc[l] = d as string;
  });

  const updated: ProductPublication = {
    ...current,
    title: nextTitle,
    description: nextDesc,
    price,
    row_version: current.row_version + 1,
    updated_at: new Date().toISOString(),
  };

  const saved = await updateProductInRepo<ProductPublication>(shop, updated);
  return { product: saved };
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

  await deleteProductFromRepo<ProductPublication>(shop, id);
  redirect(`/cms/shop/${shop}/products`);
}
