import {
  HeroBanner,
  ReviewsCarousel,
  ValueProps,
  Footer,
  Header,
  SideNav,
  AppShell,
} from "@ui";
import { resolveLocale } from "@i18n/locales";
import TranslationsProvider from "@i18n/Translations";
import {
  tokens as baseTokensSrc,
  type TokenMap as BaseTokenMap,
} from "@themes/base";
import { draftMode } from "next/headers";
import type { CSSProperties } from "react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type TokenMap = Record<`--${string}`, string>;

const baseTokens: TokenMap = Object.fromEntries(
  Object.entries(baseTokensSrc as BaseTokenMap).map(([k, v]) => [k, v.light])
) as TokenMap;

async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (theme === "base") return baseTokens;
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return mod.tokens as TokenMap;
  } catch {
    return baseTokens;
  }
}

export default async function PreviewView({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;
  const dm = await draftMode();
  if (!dm.isEnabled) {
    dm.enable();
  }
  const theme = typeof sp.theme === "string" ? sp.theme : "base";

  const lang = resolveLocale(typeof sp.lang === "string" ? sp.lang : "en");

  const tokens = await loadThemeTokens(theme);
  const style = Object.fromEntries(Object.entries(tokens)) as CSSProperties;

  const messagesMap = {
    en: () => import("@i18n/en.json"),
    de: () => import("@i18n/de.json"),
    it: () => import("@i18n/it.json"),
  } as const;
  const messages = (await messagesMap[lang]()).default;

  return (
    <div style={style} className="min-h-screen">
      <TranslationsProvider messages={messages}>
        <AppShell
          header={<Header locale={lang} />}
          sideNav={<SideNav />}
          footer={<Footer />}
        >
          <HeroBanner />
          <ValueProps />
          <ReviewsCarousel />
        </AppShell>
      </TranslationsProvider>
    </div>
  );
}
