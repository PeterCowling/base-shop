"use server";

import { redirect } from "next/navigation";
import { scaffoldSpecSchema, type ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";

export async function createDraft(shop: string, spec: ScaffoldSpec) {
  const parsed = scaffoldSpecSchema.parse(spec);
  return { id: `draft-${Date.now()}`, spec: parsed, shop };
}

export async function finalize(shop: string, draftId: string) {
  redirect(`/cms/shop/${shop}/pages/${draftId}/builder`);
}
