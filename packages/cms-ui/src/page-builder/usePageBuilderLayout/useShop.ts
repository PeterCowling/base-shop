// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { getShopFromPath } from "@acme/lib/shop";

export default function useShop() {
  const pathname = usePathname() ?? "";
  return useMemo(() => getShopFromPath(pathname), [pathname]);
}
