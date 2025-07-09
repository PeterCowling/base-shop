import { createDraftRecord } from "@cms/actions/products.server";
import { redirect } from "next/navigation";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const draft = await createDraftRecord(shop);
  redirect(`/cms/shop/${shop}/products/${draft.id}/edit`);
}
