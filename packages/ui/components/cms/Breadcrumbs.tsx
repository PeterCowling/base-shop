// packages/ui/components/cms/Breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import { memo } from "react";
import Breadcrumbs, { BreadcrumbItem } from "../molecules/Breadcrumbs";

function BreadcrumbsInner() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean); // ["products","123","edit"]

  let href = "";
  const items: BreadcrumbItem[] = parts.map((part) => {
    href += `/${part}`;
    return { label: part, href };
  });

  return <Breadcrumbs items={items} />;
}

export default memo(BreadcrumbsInner);
