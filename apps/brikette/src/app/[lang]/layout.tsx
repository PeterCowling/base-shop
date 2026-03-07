import type { ReactNode } from "react";

import { loadMessages } from "@acme/i18n/loadMessages.server";

import { getNamespaceBundles } from "@/app/_lib/i18n-server";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { CORE_LAYOUT_I18N_NAMESPACES } from "@/i18n.namespaces";

import ClientLayout from "./ClientLayout";

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return i18nConfig.supportedLngs.map((lang) => ({ lang }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { lang } = await params;
  const appLang = (
    i18nConfig.supportedLngs.includes(lang as AppLanguage)
      ? (lang as AppLanguage)
      : (i18nConfig.fallbackLng as AppLanguage)
  );
  const dir = appLang === "ar" ? "rtl" : "ltr";
  const sharedMessages = await loadMessages(appLang);
  const appNamespaceBundles = await getNamespaceBundles(appLang, [
    ...CORE_LAYOUT_I18N_NAMESPACES,
    "modals",
  ]);

  return (
    <ClientLayout
      lang={appLang}
      dir={dir}
      sharedMessages={sharedMessages}
      appNamespaceBundles={appNamespaceBundles}
    >
      <AboutStructuredData />
      <SiteSearchStructuredData lang={appLang} />
      {children}
    </ClientLayout>
  );
}
