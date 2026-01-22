"use client";

// src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx
// Client component for breakfast menu content (uses useTranslation hook)
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/ui/atoms";

import BreakfastMenuStructuredData from "@/components/seo/BreakfastMenuStructuredData";
import { BASE_URL } from "@/config/site";
import { type BreakfastMenuItemKey,formatBreakfastMenuPrice } from "@/data/menuPricing";
import type { AppLanguage } from "@/i18n.config";
import { MenuRow } from "@/routes/breakfast-menu/_MenuRow";
import { JSON_LD_MIME, STRUCTURED_DATA_ID } from "@/routes/breakfast-menu/constants";
import { createMenuGraph } from "@/routes/breakfast-menu/menu-graph";
import { createBreakfastMenuStrings } from "@/routes/breakfast-menu/strings";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
};

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
              <a
                href="#menuSections"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-brand-primary px-6 py-2 text-base font-semibold text-brand-bg shadow-sm transition-colors hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                {introCta}
              </a>
            </div>
          ) : null}
        </header>

        {/* Eggs Combo */}
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

        {/* Sweet Options */}
        <h2 className="mb-4 mt-8 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
          {breakfastMenuString("sections.sweet.title")}
        </h2>
        <MenuRow
          name={breakfastMenuString("items.frenchToast.name")}
          price={getDisplayPrice("frenchToast")}
          note={getItemNote("frenchToast")}
        />
        <MenuRow
          name={breakfastMenuString("items.nutellaFrenchToast.name")}
          price={getDisplayPrice("nutellaFrenchToast")}
          note={getItemNote("nutellaFrenchToast")}
        />
        <MenuRow
          name={breakfastMenuString("items.pancakes.name")}
          price={getDisplayPrice("pancakes")}
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

        <MenuRow
          name={breakfastMenuString("items.addEggComboItem.name")}
          price={getDisplayPrice("addEggComboItem")}
          note={getItemNote("addEggComboItem")}
        />
        <MenuRow
          name={breakfastMenuString("items.addAdditionalSyrup.name")}
          price={getDisplayPrice("addAdditionalSyrup")}
          note={getItemNote("addAdditionalSyrup")}
        />

        {/* Healthy Options */}
        <h2 className="mb-4 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
          {breakfastMenuString("sections.healthy.title")}
        </h2>
        <MenuRow
          name={breakfastMenuString("items.veggieToast.name")}
          price={getDisplayPrice("veggieToast")}
          note={getItemNote("veggieToast")}
        />
        <MenuRow
          name={breakfastMenuString("items.healthyDelight.name")}
          price={getDisplayPrice("healthyDelight")}
          note={getItemNote("healthyDelight")}
        />

        {/* Juices and Smoothies */}
        <h2 className="mb-4 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
          {breakfastMenuString("sections.juices.title")}
        </h2>
        <MenuRow
          name={breakfastMenuString("items.detoxMe.name")}
          price={getDisplayPrice("detoxMe")}
          note={getItemNote("detoxMe")}
        />
        <MenuRow
          name={breakfastMenuString("items.energizeMe.name")}
          price={getDisplayPrice("energizeMe")}
          note={getItemNote("energizeMe")}
        />
        <MenuRow
          name={breakfastMenuString("items.multiV.name")}
          price={getDisplayPrice("multiV")}
          note={getItemNote("multiV")}
        />
        <MenuRow
          name={breakfastMenuString("items.orangeJuice.name")}
          price={getDisplayPrice("orangeJuice")}
          note={getItemNote("orangeJuice")}
        />
        <MenuRow
          name={breakfastMenuString("items.bananaSmoothie.name")}
          price={getDisplayPrice("bananaSmoothie")}
        />
        <MenuRow
          name={breakfastMenuString("items.strawberrySmoothie.name")}
          price={getDisplayPrice("strawberrySmoothie")}
        />
        <MenuRow
          name={breakfastMenuString("items.saltedCaramelProteinSmoothie.name")}
          price={getDisplayPrice("saltedCaramelProteinSmoothie")}
        />
        <MenuRow
          name={breakfastMenuString("items.addProtein.name")}
          price={getDisplayPrice("addProtein")}
        />

        {/* Hot Caffeine */}
        <h2 className="mb-4 mt-8 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
          {breakfastMenuString("sections.hot.title")}
        </h2>
        <MenuRow name={breakfastMenuString("items.tea.name")} price={getDisplayPrice("tea")} />
        <MenuRow
          name={breakfastMenuString("items.espresso.name")}
          price={getDisplayPrice("espresso")}
        />
        <MenuRow
          name={breakfastMenuString("items.macchiato.name")}
          price={getDisplayPrice("macchiato")}
        />
        <MenuRow
          name={breakfastMenuString("items.americano.name")}
          price={getDisplayPrice("americano")}
        />
        <MenuRow
          name={breakfastMenuString("items.cappuccino.name")}
          price={getDisplayPrice("cappuccino")}
        />
        <MenuRow name={breakfastMenuString("items.latte.name")} price={getDisplayPrice("latte")} />
        <MenuRow
          name={breakfastMenuString("items.altMilk.name")}
          price={getDisplayPrice("altMilk")}
        />

        {/* Iced Caffeine */}
        <h2 className="mb-4 mt-8 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
          {breakfastMenuString("sections.iced.title")}
        </h2>
        <MenuRow
          name={breakfastMenuString("items.icedLatte.name")}
          price={getDisplayPrice("icedLatte")}
        />
        <MenuRow
          name={breakfastMenuString("items.icedSoyLatte.name")}
          price={getDisplayPrice("icedSoyLatte")}
        />
        <MenuRow
          name={breakfastMenuString("items.icedRiceLatte.name")}
          price={getDisplayPrice("icedRiceLatte")}
        />
        <MenuRow
          name={breakfastMenuString("items.icedTea.name")}
          price={getDisplayPrice("icedTea")}
        />
      </Section>
    </Fragment>
  );
}
