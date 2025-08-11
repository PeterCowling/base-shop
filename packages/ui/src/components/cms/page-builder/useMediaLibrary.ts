import { getShopFromPath } from "@platform-core/utils";
import type { MediaItem } from "@acme/types";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export default function useMediaLibrary() {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const loadMedia = useCallback(async () => {
    if (!shop) return;
    try {
      const res = await fetch(`/cms/api/media?shop=${shop}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMedia(data);
      }
    } catch {
      /* silent */
    }
  }, [shop]);

  return { media, setMedia, loadMedia, shop };
}
