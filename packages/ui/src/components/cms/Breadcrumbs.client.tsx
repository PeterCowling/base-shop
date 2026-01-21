// packages/ui/components/cms/Breadcrumbs.tsx
"use client";

 

import { memo, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useTranslations } from "@acme/i18n";
import { getShopFromPath } from "@acme/lib/shop";
import type { Page,ProductPublication  } from "@acme/types";

import Breadcrumbs, { type BreadcrumbItem } from "../molecules/Breadcrumbs";

const LABEL_KEYS: Record<string, string | null> = {
  cms: null,
  shop: "cms.breadcrumb.shop",
  products: "cms.breadcrumb.products",
  pages: "cms.breadcrumb.pages",
  media: "cms.breadcrumb.media",
  settings: "cms.breadcrumb.settings",
  live: "cms.breadcrumb.live",
  rbac: "cms.breadcrumb.rbac",
  wizard: "cms.breadcrumb.wizard",
  "account-requests": "cms.breadcrumb.accountRequests",
  builder: "cms.breadcrumb.builder",
  edit: "cms.breadcrumb.edit",
  seo: "cms.breadcrumb.seo",
  uploads: "Uploads",
  "stock-inflows": "Stock inflows",
};

function BreadcrumbsInner() {
  const t = useTranslations();
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
            const pages: Page[] = await res.json();
            const page = pages.find((p: Page) => p.slug === slug) ?? null;
            if (page?.seo?.title) next[slug] = page.seo.title as string;
          }
        } catch {
          /* ignore fetch errors */
        }
      }

      setExtra(next);
    }
    fetchLabels();
  }, [pathname, shop]);

  let href = "";
  const items: BreadcrumbItem[] = [];
  for (const part of parts) {
    href += `/${part}`;
    const label = LABEL_KEYS.hasOwnProperty(part)
      ? LABEL_KEYS[part]
        ? (t(LABEL_KEYS[part] as string) as string)
        : null
      : extra[part] || part;
    if (!label) continue;
    items.push({ label, href });
  }

  return <Breadcrumbs items={items} />;
}

export default memo(BreadcrumbsInner);
