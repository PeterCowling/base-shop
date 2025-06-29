// packages/ui/components/cms/Breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import { memo } from "react";
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

  let href = "";
  const items: BreadcrumbItem[] = [];
  for (const part of parts) {
    href += `/${part}`;
    const label = LABELS.hasOwnProperty(part) ? LABELS[part] : part;
    if (!label) continue;
    items.push({ label, href });
  }

  return <Breadcrumbs items={items} />;
}

export default memo(BreadcrumbsInner);
