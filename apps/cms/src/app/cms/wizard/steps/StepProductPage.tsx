"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import ProductPageBuilder from "@/components/cms/ProductPageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@types";
import { historyStateSchema } from "@types";
import { fetchJson } from "@shared-utils";
import { ulid } from "ulid";
import { useEffect, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  productLayout: string;
  setProductLayout: (v: string) => void;
  productComponents: PageComponent[];
  setProductComponents: (v: PageComponent[]) => void;
  productPageId: string | null;
  setProductPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepProductPage({
  pageTemplates,
  productLayout,
  setProductLayout,
  productComponents,
  setProductComponents,
  productPageId,
  setProductPageId,
  shopId,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    (async () => {
      if (!shopId) return;
      try {
        const pages = await fetchJson<Page[]>(`/cms/api/pages/${shopId}`);
        const existing = productPageId
          ? pages.find((p) => p.id === productPageId)
          : pages.find((p) => p.slug === "product");
        if (existing) {
          setProductPageId(existing.id);
          setProductComponents(existing.components);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `page-builder-history-${existing.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  existing.history ?? {
                    past: [],
                    present: existing.components,
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
  }, [shopId, productPageId, setProductComponents, setProductPageId]);
  const [, markComplete] = useStepCompletion("product-page");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Product Detail Page</h2>
      <Select
        value={productLayout}
        onValueChange={(val) => {
          const layout = val === "blank" ? "" : val;
          setProductLayout(layout);
          const tpl = pageTemplates.find((t) => t.name === layout);
          if (tpl) {
            setProductComponents(
              tpl.components.map((c) => ({ ...c, id: ulid() }))
            );
          } else {
            setProductComponents([]);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blank">Blank</SelectItem>
          {pageTemplates.map((t) => (
            <SelectItem key={t.name} value={t.name}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ProductPageBuilder
        page={
          {
            id: productPageId ?? "",
            slug: "",
            status: "draft",
            components: productComponents,
            seo: {
              title: fillLocales(undefined, ""),
              description: fillLocales(undefined, ""),
              image: fillLocales(undefined, ""),
              brand: fillLocales(undefined, ""),
              offers: fillLocales(undefined, ""),
              aggregateRating: fillLocales(undefined, ""),
            },
            createdAt: "",
            updatedAt: "",
            createdBy: "",
          } as Page
        }
        onSave={async (fd) => {
          try {
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setProductPageId(json.id);
            setToast({ open: true, message: "Draft saved" });
          } catch {
            setToast({ open: true, message: "Failed to save page" });
          }
        }}
        onPublish={async (fd) => {
          try {
            fd.set("status", "published");
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setProductPageId(json.id);
            setToast({ open: true, message: "Page published" });
          } catch {
            setToast({ open: true, message: "Failed to publish page" });
          }
        }}
        onChange={setProductComponents}
        style={themeStyle}
      />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => {
            markComplete(true);
            onNext();
          }}
        >
          Next
        </Button>
      </div>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
