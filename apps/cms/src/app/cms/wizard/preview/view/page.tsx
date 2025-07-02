import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import { resolveLocale } from "@i18n/locales";
import TranslationsProvider from "@i18n/Translations";
import { tokens as baseTokensSrc } from "@themes/base/tokens";
import { draftMode } from "next/headers";
import type { CSSProperties } from "react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type TokenMap = Record<`--${string}`, string>;

const baseTokens: TokenMap = Object.fromEntries(
  Object.entries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (theme === "base") return baseTokens;
  try {
    const mod = await import(`@themes/${theme}/tailwind-tokens`);
    return mod.tokens as TokenMap;
  } catch {
    return baseTokens;
  }
}

export default async function PreviewView({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  const dm = await draftMode();
  if (!dm.isEnabled) {
    dm.enable();
  }
  const theme =
    typeof searchParams.theme === "string" ? searchParams.theme : "base";
  const template =
    typeof searchParams.template === "string"
      ? searchParams.template
      : "template-app";
  const lang = resolveLocale(
    typeof searchParams.lang === "string" ? searchParams.lang : "en"
  );

  const tokens = await loadThemeTokens(theme);
  const style = Object.fromEntries(Object.entries(tokens)) as CSSProperties;

  const messages = (
    await import(/* webpackInclude: /(en|de|it)\.json$/ */ `@i18n/${lang}.json`)
  ).default;

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
