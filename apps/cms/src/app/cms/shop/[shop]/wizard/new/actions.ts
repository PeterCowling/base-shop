"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { scaffoldSpecSchema } from "@acme/types/page/ScaffoldSpec";

const createDraftSchema = z.object({
  shop: z.string(),
  spec: scaffoldSpecSchema,
});

export async function createDraft(input: z.infer<typeof createDraftSchema>) {
  const { shop, spec } = createDraftSchema.parse(input);
  return { id: `draft-${Date.now()}`, spec, shop };
}

const finalizeSchema = z.object({
  shop: z.string(),
  draftId: z.string(),
});

export async function finalize(input: z.infer<typeof finalizeSchema>) {
  const { shop, draftId } = finalizeSchema.parse(input);
  redirect(`/cms/shop/${shop}/pages/${draftId}/builder`);
}
