import type { ReactNode } from "react";

import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getOrigin } from "@/root/environment";

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
  const validLang = i18nConfig.supportedLngs.includes(lang as AppLanguage)
    ? lang
    : i18nConfig.fallbackLng;
  const dir = validLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={validLang} dir={dir} data-origin={getOrigin()} suppressHydrationWarning>
      <body className="antialiased">
        <ClientLayout lang={validLang as AppLanguage}>{children}</ClientLayout>
      </body>
    </html>
  );
}
