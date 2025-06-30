// apps/cms/src/app/cms/shop/[shop]/media/page.tsx

import { listMedia } from "@cms/actions/media.server";
import MediaManager from "@ui/components/cms/MediaManager";

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
  const files = await listMedia(shop);
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Media – {shop}</h2>
      <MediaManager shop={shop} initialFiles={files} />
    </div>
  );
}
