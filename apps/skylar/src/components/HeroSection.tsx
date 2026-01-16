'use client';

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";
import type { Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";
import { joinClasses } from "@/lib/joinClasses";

type HeroSectionProps = {
  lang: Locale;
  isZh: boolean;
};

export default function HeroSection({ lang, isZh }: HeroSectionProps) {
  const translator = useTranslations();
  const hostelLink = translator("links.hostel");
  const baseHero = ["rounded-[42px]", "border", "p-8", "md:p-10"];
  const zhHero = ["bg-zinc-900/70", "border-accent/60", "text-zinc-100"];
  const enHero = ["bg-panel", "border-border", "text-fg"];
  const badgeText = isZh ? "text-accent" : "text-muted-foreground";
  const primaryButtonBase = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-full",
    "px-6",
    "py-3",
    "text-xs",
    "font-semibold",
    "uppercase",
    "skylar-button-tracking",
  ];
  const primaryVariantZh = ["bg-accent", "text-zinc-900"];
  const primaryVariantEn = ["bg-slate-900", "text-white"];
  const secondaryVariantZh = ["border-accent/70", "text-accent"];
  const secondaryVariantEn = ["border-border", "text-fg"];
  return (
    <section className="skylar-hero space-y-6">
      <div className={joinClasses(...baseHero, ...(isZh ? zhHero : enHero))}>
        <div className="flex flex-col gap-6">
          <div className="skylar-hero-logo">
            <Image
              src="/skylar-logo.svg" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("logo.alt")}
              width={72}
              height={72}
              className="h-16 w-16"
              priority
            />
            <div>
              <p
                className={`text-xs uppercase skylar-nav-text ${
                  isZh ? "text-zinc-200/70" : "text-muted-foreground"
                }`}
              >
                {translator("people.companyLine")}
              </p>
              <p className="font-display text-4xl uppercase skylar-heading-tracking">
                {translator("hero.headline")}
              </p>
            </div>
          </div>
          <p
            className={joinClasses(
              "text-xs",
              "uppercase",
              "skylar-support-tracking",
              badgeText
            )}
          >
            {translator("hero.subhead")}
          </p>
          <p
            className={joinClasses(
              "text-sm",
              "uppercase",
              "skylar-support-tracking",
              isZh ? "text-zinc-200/70" : "text-muted-foreground"
            )}
          >
            {translator("hero.support")}
          </p>
          <p
            className={joinClasses(
              "font-body",
              "text-base",
              "leading-7",
              isZh ? "text-zinc-200" : "text-muted-foreground"
            )}
          >
              {translator("hero.copy")}
            </p>
          <div className="skylar-hero-actions">
            <Link
              href={localizedPath(lang, "products")}
              className={joinClasses(
                ...primaryButtonBase,
                "skylar-pill",
                "primary",
                ...(isZh ? primaryVariantZh : primaryVariantEn)
              )}
            >
              {translator("hero.cta.primary")}
            </Link>
            <a
              href={hostelLink}
              target="_blank"
              rel="noreferrer"
              className={joinClasses(
                ...primaryButtonBase,
                "skylar-pill",
                "secondary",
                ...(isZh ? secondaryVariantZh : secondaryVariantEn)
              )}
            >
              {translator("hero.cta.secondary")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
