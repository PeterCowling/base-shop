import type { ReactNode } from "react";

import { resolveLocale } from "@acme/i18n/locales";

import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);

  return (
    <>
      <Header lang={lang} />
      <main className="mx-auto min-h-dvh w-full max-w-5xl px-6 py-12">
        {children}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
