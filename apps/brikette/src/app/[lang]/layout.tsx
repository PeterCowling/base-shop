import type { ReactNode } from "react";

import AboutStructuredData from "@/components/seo/AboutStructuredData";
import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { type AppLanguage, i18nConfig } from "@/i18n.config";

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

  return (
    <ClientLayout lang={appLang} dir={dir}>
      <AboutStructuredData />
      <SiteSearchStructuredData lang={appLang} />
      {children}
    </ClientLayout>
  );
}
