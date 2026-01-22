"use client";

// src/app/[lang]/bar-menu/BarMenuContent.tsx
// Client component for bar menu content (uses useTranslation hook)
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/ui/atoms";

import BarMenuStructuredData from "@/components/seo/BarMenuStructuredData";
import { BASE_URL } from "@/config/site";
import { type BarMenuItemKey,formatBarMenuPrice } from "@/data/menuPricing";
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
  const menuJson = buildBarMenuStructuredData({
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
      <BarMenuStructuredData type={JSON_LD_MIME} json={menuJson} />

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
              <a
                href="#menuSections"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-brand-primary px-6 py-2 text-base font-semibold text-brand-bg shadow-sm transition-colors hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                {introCta}
              </a>
            </div>
          ) : null}
        </header>

        <div id="menuSections" className="space-y-10">
          {/* Spritz & Frozen Cocktails */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.spritzFrozen.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.aperolSpritz.name")}
                price={getDisplayPrice("aperolSpritz")}
                note={getItemNote("aperolSpritz")}
              />
              <MenuRow
                name={barMenuString("items.limoncelloSpritz.name")}
                price={getDisplayPrice("limoncelloSpritz")}
                note={getItemNote("limoncelloSpritz")}
              />
              <MenuRow
                name={barMenuString("items.hugoSpritz.name")}
                price={getDisplayPrice("hugoSpritz")}
                note={getItemNote("hugoSpritz")}
              />
              <MenuRow
                name={barMenuString("items.rossiniSpritz.name")}
                price={getDisplayPrice("rossiniSpritz")}
                note={getItemNote("rossiniSpritz")}
              />
              <MenuRow
                name={barMenuString("items.lemonStrawberryDaiquiri.name")}
                price={getDisplayPrice("lemonStrawberryDaiquiri")}
              />
              <MenuRow
                name={barMenuString("items.lemonStrawberryMargarita.name")}
                price={getDisplayPrice("lemonStrawberryMargarita")}
                note={getItemNote("lemonStrawberryMargarita")}
              />
              <MenuRow
                name={barMenuString("items.lemonDropMartini.name")}
                price={getDisplayPrice("lemonDropMartini")}
                note={getItemNote("lemonDropMartini")}
              />
            </div>
          </section>

          {/* House Wine */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.houseWine.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.redWhiteGlass.name")}
                price={getDisplayPrice("redWhiteGlass")}
              />
              <MenuRow
                name={barMenuString("items.redWhiteBottle.name")}
                price={getDisplayPrice("redWhiteBottle")}
              />
              <MenuRow
                name={barMenuString("items.proseccoGlass.name")}
                price={getDisplayPrice("proseccoGlass")}
              />
            </div>
          </section>

          {/* Beer */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.beer.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.nastro330.name")}
                price={getDisplayPrice("nastro330")}
              />
              <MenuRow
                name={barMenuString("items.peroni330.name")}
                price={getDisplayPrice("peroni330")}
              />
              <MenuRow
                name={barMenuString("items.nastro660.name")}
                price={getDisplayPrice("nastro660")}
              />
              <MenuRow
                name={barMenuString("items.peroni660.name")}
                price={getDisplayPrice("peroni660")}
              />
            </div>
          </section>

          {/* Vodka */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.vodka.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow name={barMenuString("items.skyy.name")} price={getDisplayPrice("skyy")} />
              <MenuRow
                name={barMenuString("items.absolut.name")}
                price={getDisplayPrice("absolut")}
              />
              <MenuRow
                name={barMenuString("items.smirnoff.name")}
                price={getDisplayPrice("smirnoff")}
              />
              <MenuRow
                name={barMenuString("items.greyGoose.name")}
                price={getDisplayPrice("greyGoose")}
              />
            </div>
            {getSectionNote("vodka") && (
              <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-surface/70">
                {getSectionNote("vodka")}
              </p>
            )}
          </section>

          {/* Rum */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.rum.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.pampero.name")}
                price={getDisplayPrice("pampero")}
              />
              <MenuRow
                name={barMenuString("items.bacardiSuperior.name")}
                price={getDisplayPrice("bacardiSuperior")}
              />
              <MenuRow
                name={barMenuString("items.captainMorgan.name")}
                price={getDisplayPrice("captainMorgan")}
              />
              <MenuRow
                name={barMenuString("items.angosturaReserva.name")}
                price={getDisplayPrice("angosturaReserva")}
              />
            </div>
            {getSectionNote("rum") && (
              <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-surface/70">
                {getSectionNote("rum")}
              </p>
            )}
          </section>

          {/* Gin Mixed Drinks */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.gin.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.beefeater.name")}
                price={getDisplayPrice("beefeater")}
              />
              <MenuRow
                name={barMenuString("items.bombaySapphire.name")}
                price={getDisplayPrice("bombaySapphire")}
              />
              <MenuRow
                name={barMenuString("items.tanqueray.name")}
                price={getDisplayPrice("tanqueray")}
              />
              <MenuRow
                name={barMenuString("items.hendricks.name")}
                price={getDisplayPrice("hendricks")}
              />
            </div>
            {getSectionNote("gin") && (
              <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-surface/70">
                {getSectionNote("gin")}
              </p>
            )}
          </section>

          {/* Whisky */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.whisky.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow name={barMenuString("items.jwRed.name")} price={getDisplayPrice("jwRed")} />
              <MenuRow
                name={barMenuString("items.jameson.name")}
                price={getDisplayPrice("jameson")}
              />
              <MenuRow
                name={barMenuString("items.jackDaniels.name")}
                price={getDisplayPrice("jackDaniels")}
              />
              <MenuRow
                name={barMenuString("items.wildTurkey.name")}
                price={getDisplayPrice("wildTurkey")}
              />
              <MenuRow
                name={barMenuString("items.chivas12.name")}
                price={getDisplayPrice("chivas12")}
              />
              <MenuRow
                name={barMenuString("items.glenfiddich12.name")}
                price={getDisplayPrice("glenfiddich12")}
              />
            </div>
            {getSectionNote("whisky") && (
              <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-surface/70">
                {getSectionNote("whisky")}
              </p>
            )}
          </section>

          {/* Shots */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.shots.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.joseCuervoSilver.name")}
                price={getDisplayPrice("joseCuervoSilver")}
                note={getItemNote("joseCuervoSilver")}
              />
              <MenuRow
                name={barMenuString("items.limoncelloShot.name")}
                price={getDisplayPrice("limoncelloShot")}
                note={getItemNote("limoncelloShot")}
              />
            </div>
          </section>

          {/* Gelato */}
          <section>
            <h2 className="mb-2 text-2xl font-bold text-brand-heading dark:text-brand-secondary">
              {barMenuString("sections.gelato.title")}
            </h2>
            <div className="divide-y divide-brand-surface/60 dark:divide-brand-surface/20">
              <MenuRow
                name={barMenuString("items.oneScoop.name")}
                price={getDisplayPrice("oneScoop")}
              />
              <MenuRow
                name={barMenuString("items.twoScoops.name")}
                price={getDisplayPrice("twoScoops")}
              />
              <MenuRow
                name={barMenuString("items.threeScoops.name")}
                price={getDisplayPrice("threeScoops")}
                note={getItemNote("threeScoops")}
              />
            </div>
          </section>

          <p className="text-xs text-brand-text/60 dark:text-brand-surface/60">
            {barMenuString("disclaimer")}
          </p>
        </div>
      </Section>
    </Fragment>
  );
}
