import { createDraftRecord } from "@cms/actions/products.server";
import { redirect } from "next/navigation";

export default async function NewProductPage({
  params,
}: {
  params: { shop: string };
}) {
  const draft = await createDraftRecord(params.shop);
  redirect(`/cms/shop/${params.shop}/products/${draft.id}/edit`);
}
