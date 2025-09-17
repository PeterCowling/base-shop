// apps/cms/src/app/cms/shop/[shop]/media/page.tsx

import { deleteMedia, getMediaOverview } from "@cms/actions/media.server";
import { checkShopExists } from "@acme/lib";
import { notFound } from "next/navigation";
import MediaPageClient from "./MediaPageClient";

interface Params {
  shop: string;
}

export const revalidate = 0;

export default async function MediaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;

  if (!(await checkShopExists(shop))) return notFound();

  const overview = await getMediaOverview(shop);

  return (
    <MediaPageClient shop={shop} overview={overview} onDelete={deleteMedia} />
  );
}
