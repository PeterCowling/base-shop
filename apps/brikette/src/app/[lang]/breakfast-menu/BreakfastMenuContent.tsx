"use client";

// src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx
// Client component for breakfast menu content (uses useTranslation hook)
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";

import BreakfastMenuStructuredData from "@/components/seo/BreakfastMenuStructuredData";
import { BASE_URL } from "@/config/site";
import { type BreakfastMenuItemKey, formatBreakfastMenuPrice } from "@/data/menuPricing";
import type { AppLanguage } from "@/i18n.config";
import { MenuRow } from "@/routes/breakfast-menu/_MenuRow";
import { JSON_LD_MIME, STRUCTURED_DATA_ID } from "@/routes/breakfast-menu/constants";
import { createMenuGraph } from "@/routes/breakfast-menu/menu-graph";
import { createBreakfastMenuStrings } from "@/routes/breakfast-menu/strings";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
};

type MenuItemConfig = {
  key: BreakfastMenuItemKey;
  nameKey: `items.${string}.name`;
  withItemNote?: boolean;
};

type MenuSectionConfig = {
  id: "eggs" | "sweet" | "healthy" | "juices" | "hot" | "iced";
  titleKey: `sections.${string}.title`;
  subtitleKey?: `sections.${string}.subtitle`;
  items: MenuItemConfig[];
};

const MENU_SECTIONS: MenuSectionConfig[] = [
  {
    id: "sweet",
    titleKey: "sections.sweet.title",
    items: [
      { key: "frenchToast", nameKey: "items.frenchToast.name", withItemNote: true },
      { key: "nutellaFrenchToast", nameKey: "items.nutellaFrenchToast.name", withItemNote: true },
      { key: "pancakes", nameKey: "items.pancakes.name" },
      { key: "addEggComboItem", nameKey: "items.addEggComboItem.name", withItemNote: true },
      { key: "addAdditionalSyrup", nameKey: "items.addAdditionalSyrup.name", withItemNote: true },
    ],
  },
  {
    id: "healthy",
    titleKey: "sections.healthy.title",
    items: [
      { key: "veggieToast", nameKey: "items.veggieToast.name", withItemNote: true },
      { key: "healthyDelight", nameKey: "items.healthyDelight.name", withItemNote: true },
    ],
  },
  {
    id: "juices",
    titleKey: "sections.juices.title",
    items: [
      { key: "detoxMe", nameKey: "items.detoxMe.name", withItemNote: true },
      { key: "energizeMe", nameKey: "items.energizeMe.name", withItemNote: true },
      { key: "multiV", nameKey: "items.multiV.name", withItemNote: true },
      { key: "orangeJuice", nameKey: "items.orangeJuice.name", withItemNote: true },
      { key: "bananaSmoothie", nameKey: "items.bananaSmoothie.name" },
      { key: "strawberrySmoothie", nameKey: "items.strawberrySmoothie.name" },
      { key: "saltedCaramelProteinSmoothie", nameKey: "items.saltedCaramelProteinSmoothie.name" },
      { key: "addProtein", nameKey: "items.addProtein.name" },
    ],
  },
  {
    id: "hot",
    titleKey: "sections.hot.title",
    items: [
      { key: "tea", nameKey: "items.tea.name" },
      { key: "espresso", nameKey: "items.espresso.name" },
      { key: "macchiato", nameKey: "items.macchiato.name" },
      { key: "americano", nameKey: "items.americano.name" },
      { key: "cappuccino", nameKey: "items.cappuccino.name" },
      { key: "latte", nameKey: "items.latte.name" },
      { key: "altMilk", nameKey: "items.altMilk.name" },
    ],
  },
  {
    id: "iced",
    titleKey: "sections.iced.title",
    items: [
      { key: "icedLatte", nameKey: "items.icedLatte.name" },
      { key: "icedSoyLatte", nameKey: "items.icedSoyLatte.name" },
      { key: "icedRiceLatte", nameKey: "items.icedRiceLatte.name" },
      { key: "icedTea", nameKey: "items.icedTea.name" },
    ],
  },
];

function MenuItemRow({
  breakfastMenuString,
  getDisplayPrice,
  getItemNote,
  item,
}: {
  breakfastMenuString: (key: string) => string;
  getDisplayPrice: (key: BreakfastMenuItemKey) => string | undefined;
  getItemNote: (key: BreakfastMenuItemKey) => string | undefined;
  item: MenuItemConfig;
}) {
  return (
    <MenuRow
      name={breakfastMenuString(item.nameKey)}
      price={getDisplayPrice(item.key)}
      note={item.withItemNote ? getItemNote(item.key) : undefined}
    />
  );
}

function BreakfastEggsDetails({ breakfastMenuString }: { breakfastMenuString: (key: string) => string }) {
  return (
    <div className="mt-2 space-y-2 rounded-md border border-brand-surface/60 bg-brand-bg p-4 dark:border-brand-surface/20 dark:bg-brand-text">
      <p className="text-sm font-semibold text-brand-heading dark:text-brand-secondary">
        {breakfastMenuString("sections.eggs.howCooked")}
      </p>
      <ul className="list-disc pl-6 text-sm text-brand-text/90 dark:text-brand-surface/90">
        <li>{breakfastMenuString("sections.eggs.cooked.0")}</li>
        <li>{breakfastMenuString("sections.eggs.cooked.1")}</li>
        <li>{breakfastMenuString("sections.eggs.cooked.2")}</li>
        <li>{breakfastMenuString("sections.eggs.cooked.3")}</li>
      </ul>
      <p className="pt-2 text-sm font-semibold text-brand-heading dark:text-brand-secondary">
        {breakfastMenuString("sections.eggs.addThree")}
      </p>
      <ul className="list-disc pl-6 text-sm text-brand-text/90 dark:text-brand-surface/90">
        <li>{breakfastMenuString("sections.eggs.ingredients.0")}</li>
        <li>{breakfastMenuString("sections.eggs.ingredients.1")}</li>
        <li>{breakfastMenuString("sections.eggs.ingredients.2")}</li>
        <li>{breakfastMenuString("sections.eggs.ingredients.3")}</li>
      </ul>
    </div>
  );
}

export function BreakfastMenuContent({ lang }: Props) {
  const path = `/${lang}/${getSlug("breakfastMenu", lang)}`;
  const url = `${BASE_URL}${path}`;
  const { t } = useTranslation("breakfastMenuPage", { lng: lang });
  const { t: menusT } = useTranslation("menus", { lng: lang });
  const translateBreakfastMenu = (key: string) => t(key) as string;
  const translateMenus = (key: string) => menusT(key) as string;
  const { breakfastMenuString, getItemNote } = createBreakfastMenuStrings(
    lang,
    translateBreakfastMenu,
    translateMenus
  );

  const introSummaryKey = "intro.summary" as const;
  const introCtaKey = "intro.viewFullMenuButton" as const;
  const introSummary = breakfastMenuString(introSummaryKey);
  const introCta = breakfastMenuString(introCtaKey);

  const menuGraph = createMenuGraph({ lang, url, breakfastMenuString, getItemNote });
  const getDisplayPrice = (key: BreakfastMenuItemKey) => formatBreakfastMenuPrice(key, lang);

  return (
    <Fragment>
      <BreakfastMenuStructuredData
        graph={menuGraph}
        type={JSON_LD_MIME}
        dataId={STRUCTURED_DATA_ID}
        lang={lang}
      />

      <Section padding="none" className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-primary dark:text-brand-secondary">
            {breakfastMenuString("header.brand")}
          </h1>
          <p className="mt-1 text-lg font-semibold text-brand-heading dark:text-brand-secondary/90">
            {breakfastMenuString("header.menuTitle")}
          </p>
          <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/80">
            {breakfastMenuString("header.hours")}
          </p>
          {introSummary.trim() ? (
            <p className="mt-4 text-base text-brand-text/80 dark:text-brand-surface/80">
              {introSummary}
            </p>
          ) : null}
          {introCta.trim() ? (
            <div className="mt-6 flex justify-center">
              <Button asChild color="primary" tone="solid" size="lg">
                <a href="#menuSections">{introCta}</a>
              </Button>
            </div>
          ) : null}
        </header>

        <h2
          id="menuSections"
          className="mb-1 text-2xl font-bold text-brand-heading dark:text-brand-secondary"
        >
          {breakfastMenuString("sections.eggs.title")}
        </h2>
        <p className="mb-3 text-brand-text/80 dark:text-brand-surface/80">
          {breakfastMenuString("sections.eggs.subtitle")}
        </p>
        <MenuRow
          name={breakfastMenuString("items.eggsCombo.name")}
          price={getDisplayPrice("eggsCombo")}
        />
        <BreakfastEggsDetails breakfastMenuString={breakfastMenuString} />

        <h2 className="mb-4 mt-8 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
          {breakfastMenuString("sections.sweet.title")}
        </h2>
        <MenuItemRow
          breakfastMenuString={breakfastMenuString}
          getDisplayPrice={getDisplayPrice}
          getItemNote={getItemNote}
          item={{ key: "frenchToast", nameKey: "items.frenchToast.name", withItemNote: true }}
        />
        <MenuItemRow
          breakfastMenuString={breakfastMenuString}
          getDisplayPrice={getDisplayPrice}
          getItemNote={getItemNote}
          item={{
            key: "nutellaFrenchToast",
            nameKey: "items.nutellaFrenchToast.name",
            withItemNote: true,
          }}
        />
        <MenuItemRow
          breakfastMenuString={breakfastMenuString}
          getDisplayPrice={getDisplayPrice}
          getItemNote={getItemNote}
          item={{ key: "pancakes", nameKey: "items.pancakes.name" }}
        />
        <div className="mb-4 mt-2">
          <p className="text-sm text-brand-text/80 dark:text-brand-surface/80">
            {breakfastMenuString("sections.sweet.chooseOneFreeSyrup")}
          </p>
          <ul className="list-disc pl-6 text-sm text-brand-text/90 dark:text-brand-surface/90">
            <li>{breakfastMenuString("sections.sweet.syrups.0")}</li>
            <li>{breakfastMenuString("sections.sweet.syrups.1")}</li>
            <li>{breakfastMenuString("sections.sweet.syrups.2")}</li>
            <li>{breakfastMenuString("sections.sweet.syrups.3")}</li>
          </ul>
        </div>

        <MenuItemRow
          breakfastMenuString={breakfastMenuString}
          getDisplayPrice={getDisplayPrice}
          getItemNote={getItemNote}
          item={{ key: "addEggComboItem", nameKey: "items.addEggComboItem.name", withItemNote: true }}
        />
        <MenuItemRow
          breakfastMenuString={breakfastMenuString}
          getDisplayPrice={getDisplayPrice}
          getItemNote={getItemNote}
          item={{
            key: "addAdditionalSyrup",
            nameKey: "items.addAdditionalSyrup.name",
            withItemNote: true,
          }}
        />

        {MENU_SECTIONS.filter((section) => section.id !== "sweet").map((section) => (
          <Fragment key={section.id}>
            <h2
              className={[
                "mb-4 text-2xl font-bold text-brand-heading dark:text-brand-secondary",
                section.id === "hot" || section.id === "iced" ? "mt-8" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {breakfastMenuString(section.titleKey)}
            </h2>
            {section.items.map((item) => (
              <MenuItemRow
                key={item.key}
                breakfastMenuString={breakfastMenuString}
                getDisplayPrice={getDisplayPrice}
                getItemNote={getItemNote}
                item={item}
              />
            ))}
          </Fragment>
        ))}
      </Section>
    </Fragment>
  );
}
