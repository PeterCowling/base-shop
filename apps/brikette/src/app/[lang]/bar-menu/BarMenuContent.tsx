"use client";

// src/app/[lang]/bar-menu/BarMenuContent.tsx
// Client component for bar menu content (uses useTranslation hook)
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";

import BarMenuStructuredData from "@/components/seo/BarMenuStructuredData";
import { BASE_URL } from "@/config/site";
import { type BarMenuItemKey, formatBarMenuPrice } from "@/data/menuPricing";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { MenuRow } from "@/routes/bar-menu/_menu-row";
import { buildBarMenuStructuredData } from "@/routes/bar-menu/jsonld";
import { createBarMenuStrings, fallbackLang } from "@/routes/bar-menu/strings";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
};

const JSON_LD_MIME = "application/ld+json" as const;

type MenuItemConfig = {
  key: BarMenuItemKey;
  nameKey: `items.${string}.name`;
  withItemNote?: boolean;
};

type MenuSectionConfig = {
  id:
    | "spritzFrozen"
    | "houseWine"
    | "beer"
    | "vodka"
    | "rum"
    | "gin"
    | "whisky"
    | "shots"
    | "gelato";
  titleKey: `sections.${string}.title`;
  items: MenuItemConfig[];
  withSectionNote?: boolean;
};

const MENU_SECTIONS: MenuSectionConfig[] = [
  {
    id: "spritzFrozen",
    titleKey: "sections.spritzFrozen.title",
    items: [
      { key: "aperolSpritz", nameKey: "items.aperolSpritz.name" },
      { key: "limoncelloSpritz", nameKey: "items.limoncelloSpritz.name", withItemNote: true },
      { key: "hugoSpritz", nameKey: "items.hugoSpritz.name" },
      { key: "rossiniSpritz", nameKey: "items.rossiniSpritz.name" },
      { key: "lemonStrawberryDaiquiri", nameKey: "items.lemonStrawberryDaiquiri.name" },
      {
        key: "lemonStrawberryMargarita",
        nameKey: "items.lemonStrawberryMargarita.name",
        withItemNote: true,
      },
      { key: "lemonDropMartini", nameKey: "items.lemonDropMartini.name", withItemNote: true },
    ],
  },
  {
    id: "houseWine",
    titleKey: "sections.houseWine.title",
    items: [
      { key: "redWhiteGlass", nameKey: "items.redWhiteGlass.name" },
      { key: "redWhiteBottle", nameKey: "items.redWhiteBottle.name" },
      { key: "proseccoGlass", nameKey: "items.proseccoGlass.name" },
    ],
  },
  {
    id: "beer",
    titleKey: "sections.beer.title",
    items: [
      { key: "nastro330", nameKey: "items.nastro330.name" },
      { key: "peroni330", nameKey: "items.peroni330.name" },
      { key: "nastro660", nameKey: "items.nastro660.name" },
      { key: "peroni660", nameKey: "items.peroni660.name" },
    ],
  },
  {
    id: "vodka",
    titleKey: "sections.vodka.title",
    withSectionNote: true,
    items: [
      { key: "skyy", nameKey: "items.skyy.name" },
      { key: "absolut", nameKey: "items.absolut.name" },
      { key: "smirnoff", nameKey: "items.smirnoff.name" },
      { key: "greyGoose", nameKey: "items.greyGoose.name" },
    ],
  },
  {
    id: "rum",
    titleKey: "sections.rum.title",
    withSectionNote: true,
    items: [
      { key: "pampero", nameKey: "items.pampero.name" },
      { key: "bacardiSuperior", nameKey: "items.bacardiSuperior.name" },
      { key: "captainMorgan", nameKey: "items.captainMorgan.name" },
      { key: "angosturaReserva", nameKey: "items.angosturaReserva.name" },
    ],
  },
  {
    id: "gin",
    titleKey: "sections.gin.title",
    withSectionNote: true,
    items: [
      { key: "beefeater", nameKey: "items.beefeater.name" },
      { key: "bombaySapphire", nameKey: "items.bombaySapphire.name" },
      { key: "tanqueray", nameKey: "items.tanqueray.name" },
      { key: "hendricks", nameKey: "items.hendricks.name" },
    ],
  },
  {
    id: "whisky",
    titleKey: "sections.whisky.title",
    withSectionNote: true,
    items: [
      { key: "jwRed", nameKey: "items.jwRed.name" },
      { key: "jameson", nameKey: "items.jameson.name" },
      { key: "jackDaniels", nameKey: "items.jackDaniels.name" },
      { key: "wildTurkey", nameKey: "items.wildTurkey.name" },
      { key: "chivas12", nameKey: "items.chivas12.name" },
      { key: "glenfiddich12", nameKey: "items.glenfiddich12.name" },
    ],
  },
  {
    id: "shots",
    titleKey: "sections.shots.title",
    items: [
      {
        key: "joseCuervoSilver",
        nameKey: "items.joseCuervoSilver.name",
        withItemNote: true,
      },
      { key: "limoncelloShot", nameKey: "items.limoncelloShot.name", withItemNote: true },
    ],
  },
  {
    id: "gelato",
    titleKey: "sections.gelato.title",
    items: [
      { key: "oneScoop", nameKey: "items.oneScoop.name" },
      { key: "twoScoops", nameKey: "items.twoScoops.name" },
      { key: "threeScoops", nameKey: "items.threeScoops.name", withItemNote: true },
    ],
  },
];

export function BarMenuContent({ lang }: Props) {
  const { t } = useTranslation("barMenuPage", { lng: lang });
  const { t: menusT } = useTranslation("menus", { lng: lang });

  const fallbackTranslator =
    fallbackLang && fallbackLang !== lang ? i18n.getFixedT(fallbackLang, "barMenuPage") : undefined;

  const barMenuTranslate = (key: string) => t(key) as string;
  const menusTranslate = (key: string) => menusT(key) as string;
  const fallbackTranslate = fallbackTranslator
    ? (key: string) => fallbackTranslator(key) as string
    : undefined;

  const { barMenuString, getSectionNote, getItemNote } = createBarMenuStrings({
    barMenuTranslate,
    menusTranslate,
    ...(fallbackTranslate ? { fallbackTranslate } : {}),
  });

  const introSummary = barMenuString("intro.summary");
  const introCta = barMenuString("intro.viewFullMenuButton");
  const headerBrand = barMenuString("header.brand");
  const headerMenuTitle = barMenuString("header.menuTitle");
  const headerHours = barMenuString("header.hours");

  const path = `/${lang}/${getSlug("barMenu", lang)}`;
  const url = `${BASE_URL}${path}`;
  const menuData = buildBarMenuStructuredData({
    barMenuString,
    getSectionNote,
    getItemNote,
    barMenuTranslate,
    lang,
    url,
    ...(fallbackTranslate ? { fallbackTranslate } : {}),
  });

  const getDisplayPrice = (key: BarMenuItemKey) => formatBarMenuPrice(key, lang);

  return (
    <Fragment>
      <BarMenuStructuredData type={JSON_LD_MIME} data={menuData} />

      <Section padding="none" className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-primary dark:text-brand-secondary">
            {headerBrand}
          </h1>
          <p className="mt-1 text-lg font-semibold text-brand-heading dark:text-brand-secondary/90">
            {headerMenuTitle}
          </p>
          {headerHours.trim() ? (
            <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/80">
              {headerHours}
            </p>
          ) : null}
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

        <div id="menuSections" className="space-y-10">
          {MENU_SECTIONS.map((section) => (
            <section key={section.id}>
              <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
                {barMenuString(section.titleKey)}
              </h2>
              <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
                {section.items.map((item) => (
                  <MenuRow
                    key={item.key}
                    name={barMenuString(item.nameKey)}
                    price={getDisplayPrice(item.key)}
                    note={item.withItemNote ? getItemNote(item.key) : undefined}
                  />
                ))}
              </div>
              {section.withSectionNote && getSectionNote(section.id) ? (
                <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-surface/70">
                  {getSectionNote(section.id)}
                </p>
              ) : null}
            </section>
          ))}

          <p className="text-xs text-brand-text/60 dark:text-brand-surface/60">
            {barMenuString("disclaimer")}
          </p>
        </div>
      </Section>
    </Fragment>
  );
}
