import {
  getBreakfastMenuPriceAmount,
  type BreakfastMenuItemKey,
} from "@/data/menuPricing";
import type { AppLanguage } from "@/i18n.config";

export const createMenuGraph = ({
  lang,
  url,
  breakfastMenuString,
  getItemNote,
}: {
  lang: AppLanguage;
  url: string;
  breakfastMenuString: (key: string) => string;
  getItemNote: (key: BreakfastMenuItemKey) => string | undefined;
}): Record<string, unknown> => {
  const item = (key: BreakfastMenuItemKey) => {
    const name = breakfastMenuString(`items.${key}.name`);
    const desc = getItemNote(key);
    const priceAmount = getBreakfastMenuPriceAmount(key);
    const menuItem: Record<string, unknown> = {
      "@type": "MenuItem",
      name,
    };
    if (priceAmount) {
      menuItem["offers"] = {
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
    if (desc && desc.trim()) menuItem["description"] = desc;
    return menuItem;
  };

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${breakfastMenuString("header.brand")} — ${breakfastMenuString("header.menuTitle")}`,
    inLanguage: lang,
    url,
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: breakfastMenuString("sections.eggs.title"),
        description: breakfastMenuString("sections.eggs.subtitle"),
        hasMenuItem: [item("eggsCombo")],
      },
      {
        "@type": "MenuSection",
        name: breakfastMenuString("sections.sweet.title"),
        hasMenuItem: [
          item("frenchToast"),
          item("nutellaFrenchToast"),
          item("pancakes"),
          item("addEggComboItem"),
          item("addAdditionalSyrup"),
        ],
      },
      {
        "@type": "MenuSection",
        name: breakfastMenuString("sections.healthy.title"),
        hasMenuItem: [item("veggieToast"), item("healthyDelight")],
      },
      {
        "@type": "MenuSection",
        name: breakfastMenuString("sections.juices.title"),
        hasMenuItem: [
          item("detoxMe"),
          item("energizeMe"),
          item("multiV"),
          item("orangeJuice"),
          item("bananaSmoothie"),
          item("strawberrySmoothie"),
          item("saltedCaramelProteinSmoothie"),
          item("addProtein"),
        ],
      },
      {
        "@type": "MenuSection",
        name: breakfastMenuString("sections.hot.title"),
        hasMenuItem: [
          item("tea"),
          item("espresso"),
          item("macchiato"),
          item("americano"),
          item("cappuccino"),
          item("latte"),
          item("altMilk"),
        ],
      },
      {
        "@type": "MenuSection",
        name: breakfastMenuString("sections.iced.title"),
        hasMenuItem: [
          item("icedLatte"),
          item("icedSoyLatte"),
          item("icedRiceLatte"),
          item("icedTea"),
        ],
      },
    ],
  } as const;
};
