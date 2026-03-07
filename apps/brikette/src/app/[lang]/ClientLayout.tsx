"use client";

import { type ReactNode,useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { usePathname } from "next/navigation";

import TranslationsProvider, { type Messages } from "@acme/i18n/Translations";

import AppLayout from "@/components/layout/AppLayout";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { getOrigin } from "@/utils/env-helpers";
import { type AppNamespaceBundles, primeAppI18nBundles } from "@/utils/primeAppI18nBundles";

type Props = {
  lang: AppLanguage;
  dir: "ltr" | "rtl";
  sharedMessages: Messages;
  appNamespaceBundles: AppNamespaceBundles;
  children: ReactNode;
};

export default function ClientLayout({
  lang,
  dir,
  sharedMessages,
  appNamespaceBundles,
  children,
}: Props) {
  const pathname = usePathname();
  primeAppI18nBundles(lang, appNamespaceBundles);

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
    <TranslationsProvider messages={sharedMessages}>
      <I18nextProvider i18n={i18n}>
        <AppLayout lang={lang}>{children}</AppLayout>
      </I18nextProvider>
    </TranslationsProvider>
  );
}
