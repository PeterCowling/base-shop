"use client";

import { useCallback, useRef } from "react";
import type { MediaOverview } from "../../../../../actions/media.server";
import MediaManager, {
  MediaManagerHandle,
} from "@ui/components/cms/MediaManager";
import MediaOverviewHero from "./components/MediaOverviewHero";

interface MediaPageClientProps {
  shop: string;
  overview: MediaOverview;
  onDelete: (shop: string, src: string) => void | Promise<void>;
}

export default function MediaPageClient({
  shop,
  overview,
  onDelete,
}: MediaPageClientProps) {
  const managerRef = useRef<MediaManagerHandle | null>(null);

  const handleUploadClick = useCallback(() => {
    managerRef.current?.focusUploader();
  }, []);

  return (
    <div className="space-y-6">
      <MediaOverviewHero
        shop={shop}
        totalBytes={overview.totalBytes}
        fileCount={overview.files.length}
        recentUploads={overview.recentUploads}
        limits={overview.limits}
        onUploadClick={handleUploadClick}
      />
      <MediaManager
        ref={managerRef}
        shop={shop}
        initialFiles={overview.files}
        onDelete={onDelete}
      />
    </div>
  );
}
