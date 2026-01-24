import Link from "next/link";

import HeroSection from "@/components/HeroSection";
import { ItalianHome } from "@/components/ItalianHome";
import PageShell from "@/components/PageShell";
import ServicesSection from "@/components/ServicesSection";
import { SkylarTypoHome } from "@/components/SkylarTypoHome";
import { SkylarZhHero } from "@/components/SkylarZhHero";
import { ZhContactCard,ZhProductsCard, ZhRealEstateCard } from "@/components/ZhCards";
import { joinClasses } from "@/lib/joinClasses";
import { getLocaleFromParams, type LangRouteParams, type Locale } from "@/lib/locales";
import { createTranslator,getMessages } from "@/lib/messages";
import { localizedPath } from "@/lib/routes";

export { generateStaticParams } from "./generateStaticParams";

export default async function HomePage({ params }: { params?: Promise<LangRouteParams> }) {
  const resolvedParams = params ? await params : undefined;
  const lang: Locale = getLocaleFromParams(resolvedParams);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const isZh = lang === "zh";
  const isEn = lang === "en";
  const baseCard = ["rounded-3xl", "border", "p-6", "md:p-8"];
  const zhCard = ["border-accent/60", "bg-panel/60", "text-fg"];
  const enCard = ["border-border", "bg-panel", "text-fg"];
  const linkBase = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-full",
    "border",
    "px-5",
    "py-2",
    "text-xs",
    "font-semibold",
    "uppercase",
    "skylar-button-tracking",
  ];
  const zhLink = ["border-accent/70", "text-accent"];
  const enLink = ["border-border", "text-fg"];

  return (
    <PageShell lang={lang} active="home">
      {lang === "en" ? (
        <SkylarTypoHome lang={lang} />
      ) : lang === "zh" ? (
        <div className="zh-home-stack">
          <SkylarZhHero lang={lang} />
          <ZhProductsCard lang={lang} />
          <ZhRealEstateCard lang={lang} />
          <ZhContactCard lang={lang} />
        </div>
      ) : lang === "it" ? (
        <ItalianHome lang={lang} />
      ) : (
        <>
          <HeroSection lang={lang} isZh={isZh} />
          <ServicesSection lang={lang} />
          <div className={joinClasses(...baseCard, "skylar-card", ...(isZh ? zhCard : enCard))}>
            <p className="font-display text-3xl uppercase skylar-heading-tracking">
              {translator("realEstate.heading")}
            </p>
            <p className="mt-4 font-body text-base leading-6 text-muted-foreground">
              {translator("realEstate.intro")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={localizedPath(lang, "realEstate")}
                className={joinClasses(...linkBase, ...(isZh ? zhLink : enLink))}
              >
                {translator("realEstate.cta")}
              </Link>
            </div>
            {isEn && (
              <ul className="mt-4 space-y-2 text-sm uppercase skylar-properties">
                {translator("realEstate.properties")
                  .split("|")
                  .map((item) => (
                    <li key={item} className="text-foreground">
                      {item}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
