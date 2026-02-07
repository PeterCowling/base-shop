// packages/ui/src/components/cms/page-builder/useMediaLibrary.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useTranslations } from "@acme/i18n";
import { getShopFromPath } from "@acme/lib/shop";
import type { MediaItem } from "@acme/types";

export default function useMediaLibrary() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const t = useTranslations();
  const shop = useMemo(() => {
    return (
      getShopFromPath(pathname) ??
      searchParams?.get("shopId") ??
      undefined
    );
  }, [pathname, searchParams]);
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
      setError(err instanceof Error ? err.message : String(t("Failed to load media")));
    } finally {
      setLoading(false);
    }
  }, [shop, t]);

  return { media, setMedia, loadMedia, shop, loading, error } as const;
}
