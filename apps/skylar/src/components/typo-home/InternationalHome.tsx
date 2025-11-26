import type { Locale } from "@/lib/locales";
import type { Translator } from "./types";
import { TypoHeroSection } from "./HeroSection";
import { TypoProductTile, type ProductTile } from "./ProductTileSection";
import { TypoMarquee } from "./MarqueeSection";
import { TypoShowcaseGrid } from "./ShowcaseGrid";
import { TypoServicesSection } from "./ServicesSection";
import { TypoRealEstateSection } from "./RealEstateSection";
import { TypoPeopleSection } from "./PeopleSection";

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
