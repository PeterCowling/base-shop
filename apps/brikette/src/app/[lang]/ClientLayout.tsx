"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";
import i18n from "@/i18n";
import { getOrigin } from "@/utils/env-helpers";
import AppLayout from "@/components/layout/AppLayout";

type Props = {
  lang: AppLanguage;
  dir: "ltr" | "rtl";
  children: ReactNode;
};

export default function ClientLayout({ lang, dir, children }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    root.setAttribute("data-origin", getOrigin());
  }, [lang, dir]);

  return (
    <I18nextProvider i18n={i18n}>
      <AppLayout lang={lang}>{children}</AppLayout>
    </I18nextProvider>
  );
}
