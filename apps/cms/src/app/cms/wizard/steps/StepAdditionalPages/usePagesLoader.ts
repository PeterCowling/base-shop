import { useEffect } from "react";
import type { Page, PageComponent } from "@types";
import { historyStateSchema } from "@types";
import { fetchJson } from "@shared-utils";
import { toPageInfo } from "../utils/page-utils";
import type { PageInfo } from "../schema";

interface Params {
  shopId: string;
  setPages: (v: PageInfo[]) => void;
  adding: boolean;
  draftId: string | null;
  setComponents: (v: PageComponent[]) => void;
  setToast: (v: { open: boolean; message: string }) => void;
}

export default function usePagesLoader({
  shopId,
  setPages,
  adding,
  draftId,
  setComponents,
  setToast,
}: Params) {
  useEffect(() => {
    if (!shopId) return;
    (async () => {
      try {
        const loaded = await fetchJson<Page[]>(`/cms/api/pages/${shopId}`);
        setPages(loaded.map((p) => toPageInfo(p)));
        if (typeof window !== "undefined") {
          loaded.forEach((p) => {
            localStorage.setItem(
              `page-builder-history-${p.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  p.history ?? {
                    past: [],
                    present: p.components,
                    future: [],
                  }
                )
              )
            );
          });
        }
      } catch {
        setToast({ open: true, message: "Failed to load pages" });
      }
    })();
  }, [shopId, setPages, setToast]);

  useEffect(() => {
    if (!adding || !draftId || !shopId) return;
    (async () => {
      try {
        const pages = await fetchJson<Page[]>(`/cms/api/pages/${shopId}`);
        const p = pages.find((pg) => pg.id === draftId);
        if (p) {
          setComponents(p.components);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `page-builder-history-${p.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  p.history ?? {
                    past: [],
                    present: p.components,
                    future: [],
                  }
                )
              )
            );
          }
        }
      } catch {
        setToast({ open: true, message: "Failed to load pages" });
      }
    })();
  }, [adding, draftId, shopId, setComponents, setToast]);
}

