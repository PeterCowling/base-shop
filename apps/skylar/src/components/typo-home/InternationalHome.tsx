import type { Locale } from "@/lib/locales";

import { TypoHeroSection } from "./HeroSection";
import { TypoMarquee } from "./MarqueeSection";
import { TypoPeopleSection } from "./PeopleSection";
import { type ProductTile,TypoProductTile } from "./ProductTileSection";
import { TypoRealEstateSection } from "./RealEstateSection";
import { TypoServicesSection } from "./ServicesSection";
import { TypoShowcaseGrid } from "./ShowcaseGrid";
import type { Translator } from "./types";

type Props = {
  lang: Locale;
  translator: Translator;
};

const productTile: ProductTile | null = null;

export function InternationalHome({ lang, translator }: Props) {
  return (
    <div className="skylar-typo">
      <TypoHeroSection lang={lang} translator={translator} />
      <TypoProductTile translator={translator} tile={productTile} />
      <TypoMarquee translator={translator} />
      <TypoShowcaseGrid lang={lang} translator={translator} />
      <TypoServicesSection translator={translator} />
      <TypoRealEstateSection lang={lang} translator={translator} />
      <TypoPeopleSection translator={translator} />
    </div>
  );
}
