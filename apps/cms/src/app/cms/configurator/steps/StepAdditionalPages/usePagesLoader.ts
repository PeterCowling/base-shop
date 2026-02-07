"use client";

import { useEffect } from "react";

import type { Page, PageComponent } from "@acme/types";
import { historyStateSchema } from "@acme/types";
import { useToast } from "@acme/ui/operations";

import type { PageInfo } from "../../../wizard/schema";
import { toPageInfo } from "../../../wizard/utils/page-utils";
import { apiRequest } from "../../lib/api";

interface Params {
  shopId: string;
  setPages: (v: PageInfo[]) => void;
  adding: boolean;
  draftId: string | null;
  setComponents: (v: PageComponent[]) => void;
}

export default function usePagesLoader({
  shopId,
  setPages,
  adding,
  draftId,
  setComponents,
}: Params) {
  const toast = useToast();

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const { data, error } = await apiRequest<Page[]>(`/cms/api/pages/${shopId}`);
      if (data) {
        setPages(data.map((p) => toPageInfo(p)));
        if (typeof window !== "undefined") {
          data.forEach((p) => {
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
      } else if (error) {
        toast.error(error);
      }
    })();
  }, [shopId, setPages, toast]);

  useEffect(() => {
    if (!adding || !draftId || !shopId) return;
    (async () => {
      const { data, error } = await apiRequest<Page[]>(`/cms/api/pages/${shopId}`);
      if (data) {
        const p = data.find((pg) => pg.id === draftId);
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
      } else if (error) {
        toast.error(error);
      }
    })();
  }, [adding, draftId, shopId, setComponents, toast]);
}

