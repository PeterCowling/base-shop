// packages/ui/src/components/cms/page-builder/useMediaLibrary.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";

export default function useMediaLibrary() {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname) ?? undefined, [pathname]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadMedia = useCallback(async (query?: string) => {
    if (!shop) return;
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`/cms/api/media?shop=${encodeURIComponent(shop)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      let list = Array.isArray(json) ? (json as MediaItem[]) : [];
      const q = (query || "").trim().toLowerCase();
      if (q) {
        list = list.filter((it) => {
          const namePart = it.url.split("/").pop() || it.url;
          const inName = namePart.toLowerCase().includes(q);
          const inTags = (it.tags || []).some((t) => t.toLowerCase().includes(q));
          const inTitle = (it.title || "").toLowerCase().includes(q);
          const inAlt = (it.altText || "").toLowerCase().includes(q);
          return inName || inTags || inTitle || inAlt;
        });
      }
      setMedia(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [shop]);

  return { media, setMedia, loadMedia, shop, loading, error } as const;
}

