import { type BarMenuItemKey,getBarMenuPriceAmount } from "@/data/menuPricing";
import type { AppLanguage } from "@/i18n.config";

import type { BarMenuStrings } from "./strings";
import { getBarMenuFallback } from "./strings";

type StringsForStructuredData = Pick<BarMenuStrings, "barMenuString" | "getSectionNote" | "getItemNote">;

type Translate = (key: string) => string;

type BuildBarMenuStructuredDataArgs = StringsForStructuredData & {
  lang: AppLanguage;
  url: string;
  barMenuTranslate: Translate;
  fallbackTranslate?: Translate;
};

type MenuItem = {
  "@type": "MenuItem";
  name: string;
  description?: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: "EUR";
    availability: "https://schema.org/InStock";
    priceSpecification: {
      "@type": "UnitPriceSpecification";
      price: string;
      priceCurrency: "EUR";
      unitCode: "NI";
    };
  };
};

type MenuSection = {
  "@type": "MenuSection";
  name: string;
  description?: string;
  hasMenuItem: MenuItem[];
};

const resolveNameKey = (
  key: string,
  translate: Translate,
  fallbackTranslate?: Translate,
): string => {
  const fallbackFromJson = getBarMenuFallback(key);
  if (fallbackFromJson) {
    return fallbackFromJson;
  }
  const localized = translate(key);
  if (localized && localized !== key) {
    return localized;
  }
  const secondary = fallbackTranslate?.(key);
  if (secondary && secondary !== key) {
    return secondary;
  }
  return localized ?? key;
};

const buildMenuItem = (
  itemKey: BarMenuItemKey,
  getItemNote: (key: BarMenuItemKey) => string | undefined,
  barMenuTranslate: Translate,
  fallbackTranslate?: Translate,
): MenuItem => {
  const nameKey = `items.${itemKey}.name` as const;
  const name = resolveNameKey(nameKey, barMenuTranslate, fallbackTranslate);
  const description = getItemNote(itemKey);
  const priceAmount = getBarMenuPriceAmount(itemKey);

  const menuItem: MenuItem = {
    "@type": "MenuItem",
    name,
  };

  if (priceAmount) {
    menuItem.offers = {
      "@type": "Offer",
      price: priceAmount,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: priceAmount,
        priceCurrency: "EUR",
        unitCode: "NI",
      },
    };
  }

  if (description && description.trim()) {
    menuItem.description = description;
  }

  return menuItem;
};

export const buildBarMenuStructuredData = ({
  barMenuString,
  getSectionNote,
  getItemNote,
  barMenuTranslate,
  fallbackTranslate,
  lang,
  url,
}: BuildBarMenuStructuredDataArgs): string => {
  const menuTitle = barMenuString("header.menuTitle");
  const menuTitleForJsonLd = menuTitle.replace(/,\s*(?=\d)/g, " ");

  const buildSection = (key: string, itemKeys: BarMenuItemKey[], withNote = false): MenuSection => {
    const section: MenuSection = {
      "@type": "MenuSection",
      name: barMenuString(`sections.${key}.title`),
      hasMenuItem: itemKeys.map((itemKey) =>
        buildMenuItem(itemKey, getItemNote, barMenuTranslate, fallbackTranslate)
      ),
    };
    if (withNote) {
      const note = getSectionNote(key);
      if (note) {
        section.description = note;
      }
    }
    return section;
  };

  const sections: MenuSection[] = [
    buildSection("spritzFrozen", [
      "aperolSpritz",
      "limoncelloSpritz",
      "hugoSpritz",
      "rossiniSpritz",
      "lemonStrawberryDaiquiri",
      "lemonStrawberryMargarita",
      "lemonDropMartini",
    ]),
    buildSection("houseWine", ["redWhiteGlass", "redWhiteBottle", "proseccoGlass"]),
    buildSection("beer", ["nastro330", "peroni330", "nastro660", "peroni660"]),
    buildSection("vodka", ["skyy", "absolut", "smirnoff", "greyGoose"], true),
    buildSection(
      "rum",
      ["pampero", "bacardiSuperior", "captainMorgan", "angosturaReserva"],
      true,
    ),
    buildSection("gin", ["beefeater", "bombaySapphire", "tanqueray", "hendricks"], true),
    buildSection(
      "whisky",
      ["jwRed", "jameson", "jackDaniels", "wildTurkey", "chivas12", "glenfiddich12"],
      true,
    ),
    buildSection("shots", ["joseCuervoSilver", "limoncelloShot"]),
    buildSection("gelato", ["oneScoop", "twoScoops", "threeScoops"]),
  ];

  const menuGraph = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${barMenuString("header.brand")} — ${menuTitleForJsonLd}`,
    inLanguage: lang,
    url,
    hasMenuSection: sections,
  } as const;

  return JSON.stringify(menuGraph);
};
