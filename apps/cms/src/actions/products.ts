"use server";

import type { ProductPublication } from "@platform-core/products";
import { readRepo, writeRepo } from "@platform-core/repositories/json";
import { redirect } from "next/navigation";
import { ulid } from "ulid";

/**
 * Low-level helper — creates a draft product record and persists it.
 * Returns the newly created object so other server code can use it.
 */
export async function createDraftRecord(): Promise<ProductPublication> {
  const now = new Date().toISOString();

  const draft: ProductPublication = {
    id: ulid(),
    sku: `DRAFT-${Date.now()}`,
    title: { en: "Untitled" },
    price: 0,
    currency: "EUR",
    images: [],
    status: "draft",
    shop: "abc",
    row_version: 1,
    created_at: now,
    updated_at: now,
  };

  const repo = await readRepo("abc");
  await writeRepo("abc", [...repo, draft]);

  return draft;
}

/**
 * **Server action** wired to the “New product” button.
 * Returns `void`, fulfilling the `<form action=…>` contract.
 * After creating the draft it redirects the user to the
 * product-edit page for immediate editing.
 */
export async function createDraft(): Promise<void> {
  "use server";
  const draft = await createDraftRecord();
  redirect(`/products/${draft.id}/edit`);
}
