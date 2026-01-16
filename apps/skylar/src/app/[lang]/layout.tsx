import type { ReactNode } from "react";
import {
  Fraunces,
  Noto_Sans_SC,
  Poppins,
  Space_Grotesk,
} from "next/font/google";

import TranslationsProvider from "@acme/i18n/Translations";
import { getLocaleFromParams, type LangRouteParams, type Locale } from "@/lib/locales";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-poppins",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-fraunces",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space_grotesk",
});

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto",
});

const localeFonts: Record<Locale, string[]> = {
  en: [poppins.variable],
  it: [fraunces.variable, spaceGrotesk.variable],
  zh: [notoSansSc.variable],
};

type LayoutProps = {
  children: ReactNode;
  params?: Promise<LangRouteParams>;
};

export default async function LanguageLayout({ children, params }: LayoutProps) {
  const resolvedParams = params ? await params : undefined;
  const locale: Locale = getLocaleFromParams(resolvedParams);
  const fontClassName = localeFonts[locale]?.join(" ") ?? "";
  const messages = (
    await import(
      /* webpackInclude: /(en|it|zh)\.json$/ */
      `../../../i18n/${locale}.json`
    )
  ).default;
  return (
    <TranslationsProvider messages={messages}>
      <div className={`${fontClassName} skylar-shell-root skylar-shell--${locale}`} data-locale={locale}>
        {children}
      </div>
    </TranslationsProvider>
  );
}
