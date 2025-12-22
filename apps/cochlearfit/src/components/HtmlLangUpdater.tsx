"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/lib/locales";

export default function HtmlLangUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    const locale = getLocaleFromPath(pathname ?? "/");
    document.documentElement.lang = locale;
  }, [pathname]);

  return null;
}
