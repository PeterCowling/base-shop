"use client";

import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@acme/design-system/shadcn";

type PageItem = { id: string; slug: string; seo?: { title?: Record<string, string> } };
type ProductItem = { slug: string; title: string };

function deriveShopFromPath(): string | undefined {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    // Expect /cms/shop/:shop/...
    const parts = path.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "shop");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

export default function LinkPicker({
  open,
  onClose,
  onPick,
  shop,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (href: string) => void;
  shop?: string;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const shopId = useMemo(() => shop ?? deriveShopFromPath() ?? "bcd", [shop]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch(`/cms/api/pages/${shopId}`);
        if (res.ok) setPages(await res.json());
      } catch {
        setPages([]);
      }
    })();
  }, [open, shopId]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        const url = new URL(`/cms/api/products`, window.location.origin);
        url.searchParams.set("shop", shopId);
        if (query) url.searchParams.set("q", query);
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (res.ok) setProducts(await res.json());
      } catch {
        setProducts([]);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [open, query, shopId]);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>{t("cms.links.picker.title")}</DialogTitle>
          <DialogDescription>{t("cms.links.picker.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // i18n-exempt: Admin-only CMS tool UI copy.
            placeholder={t("cms.links.picker.search.placeholder")}
          />
          <div>
            {/* i18n-exempt: Admin-only CMS tool UI copy. */}
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Pages</div>
            <ul className="max-h-40 overflow-auto rounded border">
              {pages.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b px-2 py-1 last:border-none">
                  <div>
                    <div className="text-sm">{p.seo?.title?.en ?? p.slug}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </div>
                  {/* i18n-exempt: Admin-only CMS tool UI copy. */}
                  <Button type="button" className="h-8 px-2 py-1 text-xs" onClick={() => onPick(`/${p.slug}`)}>Select</Button>
                </li>
              ))}
              {pages.length === 0 && (
                // i18n-exempt: Admin-only CMS tool UI copy.
                <li className="px-2 py-1 text-sm text-muted-foreground">No pages</li>
              )}
            </ul>
          </div>
          <div>
            {/* i18n-exempt: Admin-only CMS tool UI copy. */}
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Products</div>
            <ul className="max-h-40 overflow-auto rounded border">
              {products.map((prod) => (
                <li key={prod.slug} className="flex items-center justify-between border-b px-2 py-1 last:border-none">
                  <div>
                    <div className="text-sm">{prod.title}</div>
                    <div className="text-xs text-muted-foreground">/products/{prod.slug}</div>
                  </div>
                  {/* i18n-exempt: Admin-only CMS tool UI copy. */}
                  <Button type="button" className="h-8 px-2 py-1 text-xs" onClick={() => onPick(`/products/${prod.slug}`)}>Select</Button>
                </li>
              ))}
              {products.length === 0 && (
                // i18n-exempt: Admin-only CMS tool UI copy.
                <li className="px-2 py-1 text-sm text-muted-foreground">No products</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          {/* i18n-exempt: Admin-only CMS tool UI copy. */}
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
