import { getShopFromPath } from "@acme/platform-core/utils";
import type { MediaItem } from "@acme/types";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export default function useMediaLibrary() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const shop = useMemo(() => {
    const fromPath = getShopFromPath(pathname);
    return fromPath ?? searchParams?.get("shopId") ?? undefined;
  }, [pathname, searchParams]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadMedia = useCallback(
    async (query = "") => {
      if (!shop) return;
      setLoading(true);
      setError(undefined);
      try {
        const res = await fetch(
          `/cms/api/media?shop=${shop}${
            query ? `&q=${encodeURIComponent(query)}` : ""
          }`
        );
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        if (Array.isArray(data)) setMedia(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [shop]
  );

  return { media, setMedia, loadMedia, shop, loading, error };
}
