// apps/cms/src/app/cms/shop/[shop]/media/page.tsx

import { deleteMedia, listMedia, updateMediaMetadata } from "@cms/actions/media.server";
import { checkShopExists } from "@acme/lib";
import MediaManager from "@ui/components/cms/MediaManager";
import { notFound } from "next/navigation";
import type { MediaItem } from "@acme/types";

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

  const files: MediaItem[] = await listMedia(shop);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Media – {shop}</h2>
      <MediaManager
        shop={shop}
        initialFiles={files}
        onDelete={deleteMedia}
        onUpdateMetadata={updateMediaMetadata}
      />
    </div>
  );
}
