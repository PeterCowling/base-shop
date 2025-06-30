// packages/ui/components/cms/Breadcrumbs.tsx
"use client";

import type { ProductPublication } from "@platform-core/products";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import { usePathname } from "next/navigation";
import { memo, useEffect, useState } from "react";
import Breadcrumbs, { BreadcrumbItem } from "../molecules/Breadcrumbs";

const LABELS: Record<string, string | null> = {
  cms: null,
  shop: "Shop",
  products: "Products",
  pages: "Pages",
  media: "Media",
  settings: "Settings",
  live: "Live",
  rbac: "RBAC",
  wizard: "Create Shop",
  "account-requests": "Account Requests",
  builder: "Builder",
  edit: "Edit",
  seo: "SEO",
};

function BreadcrumbsInner() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const shop = getShopFromPath(pathname);

  useEffect(() => {
    async function fetchLabels() {
      const segments = pathname.split("/").filter(Boolean);
      const shopSlug = shop;
      if (!shopSlug) return;
      const next: Record<string, string> = {};

      const prodIdx = segments.indexOf("products");
      if (prodIdx >= 0 && segments[prodIdx + 1]) {
        const id = segments[prodIdx + 1];
        try {
          const res = await fetch(`/api/products/${shopSlug}/${id}`);
          if (res.ok) {
            const data: ProductPublication = await res.json();
            const title = data?.title ? Object.values(data.title)[0] : null;
            if (title) next[id] = title as string;
          }
        } catch {
          /* ignore fetch errors */
        }
      }

      const pageIdx = segments.indexOf("pages");
      if (pageIdx >= 0 && segments[pageIdx + 1]) {
        const slug = segments[pageIdx + 1];
        try {
          const res = await fetch(`/api/pages/${shopSlug}`);
          if (res.ok) {
            const pages = await res.json();
            const page = Array.isArray(pages)
              ? pages.find((p: any) => p.slug === slug)
              : null;
            if (page?.seo?.title) next[slug] = page.seo.title as string;
          }
        } catch {
          /* ignore fetch errors */
        }
      }

      setExtra(next);
    }
    fetchLabels();
  }, [pathname]);

  let href = "";
  const items: BreadcrumbItem[] = [];
  for (const part of parts) {
    href += `/${part}`;
    const label = LABELS.hasOwnProperty(part)
      ? LABELS[part]
      : extra[part] || part;
    if (!label) continue;
    items.push({ label, href });
  }

  return <Breadcrumbs items={items} />;
}

export default memo(BreadcrumbsInner);
