"use client";

import { type ReactNode,useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { usePathname } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { getOrigin } from "@/utils/env-helpers";

type Props = {
  lang: AppLanguage;
  dir: "ltr" | "rtl";
  children: ReactNode;
};

export default function ClientLayout({ lang, dir, children }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    root.setAttribute("data-origin", getOrigin());
  }, [lang, dir]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <I18nextProvider i18n={i18n}>
      <AppLayout lang={lang}>{children}</AppLayout>
    </I18nextProvider>
  );
}
