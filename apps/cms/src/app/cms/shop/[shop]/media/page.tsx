// apps/cms/src/app/cms/shop/[shop]/media/page.tsx

import {
  deleteMedia,
  getMediaOverview,
  updateMediaMetadata,
} from "@cms/actions/media.server";
import { checkShopExists } from "@acme/lib";
import MediaManager from "@acme/ui/components/cms/MediaManager";
import { notFound } from "next/navigation";
import MediaOverviewHero from "./components/MediaOverviewHero";

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
  const { files, totalBytes, recentUploads } = overview;
  const uploaderTargetId = "media-manager-uploader";

  return (
    <div className="space-y-6">
      <MediaOverviewHero
        shop={shop}
        totalBytes={totalBytes}
        assetCount={files.length}
        recentUploads={recentUploads}
        uploaderTargetId={uploaderTargetId}
      />
      <MediaManager
        shop={shop}
        initialFiles={files}
        onDelete={deleteMedia}
        onMetadataUpdate={updateMediaMetadata}
        uploaderTargetId={uploaderTargetId}
      />
    </div>
  );
}
