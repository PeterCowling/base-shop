// apps/cms/src/app/(cms)/shop/[shop]/media/page.tsx

import { listMedia } from "@cms/actions/media";
import MediaManager from "@ui/components/cms/MediaManager";

interface Params {
  shop: string;
}

export const revalidate = 0;

export default async function MediaPage({ params }: { params: Params }) {
  const { shop } = params;
  const files = await listMedia(shop);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Media – {shop}</h2>
      <MediaManager shop={shop} initialFiles={files} />
    </div>
  );
}
