"use client";

import { useEffect, useState } from "react";

import { historyStateSchema,type Page, type PageComponent } from "@acme/types";

import { apiRequest } from "../../lib/api";

interface ToastSetter {
  (v: { open: boolean; message: string }): void;
}

interface Options {
  shopId: string;
  productPageId: string | null;
  setProductPageId: (v: string) => void;
  setProductComponents: (v: PageComponent[]) => void;
  setToast: ToastSetter;
}

export default function useProductPageData({
  shopId,
  productPageId,
  setProductPageId,
  setProductComponents,
  setToast,
}: Options) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!shopId) return;
      const { data, error } = await apiRequest<Page[]>(`/cms/api/pages/${shopId}`);
      if (data) {
        const existing: Page | undefined = productPageId
          ? data.find((p) => p.id === productPageId)
          : data.find((p) => p.slug === "product");
        if (existing) {
          setProductPageId(existing.id);
          setProductComponents(existing.components as PageComponent[]);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `page-builder-history-${existing.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  existing.history ?? {
                    past: [],
                    present: existing.components as PageComponent[],
                    future: [],
                  },
                ),
              ),
            );
          }
        }
      } else if (error) {
        setToast({ open: true, message: error });
      }
    })();
  }, [shopId, productPageId, setProductComponents, setProductPageId, setToast]);

  const saveDraft = async (fd: FormData) => {
    setIsSaving(true);
    setSaveError(null);
    const { data, error } = await apiRequest<{ id: string }>(
      `/cms/api/page-draft/${shopId}`,
      { method: "POST", body: fd },
    );
    setIsSaving(false);
    if (data) {
      setProductPageId(data.id);
      setToast({ open: true, message: "Draft saved" });
    } else if (error) {
      setSaveError(error);
    }
  };

  const publishPage = async (fd: FormData) => {
    setIsPublishing(true);
    setPublishError(null);
    fd.set("status", "published");
    const { data, error } = await apiRequest<{ id: string }>(
      `/cms/api/page/${shopId}`,
      { method: "POST", body: fd },
    );
    setIsPublishing(false);
    if (data) {
      setProductPageId(data.id);
      setToast({ open: true, message: "Page published" });
    } else if (error) {
      setPublishError(error);
    }
  };

  return {
    saveDraft,
    publishPage,
    isSaving,
    isPublishing,
    saveError,
    publishError,
  };
}

