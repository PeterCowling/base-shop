import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";

type HeroSectionProps = {
  lang: Locale;
  isZh: boolean;
  translator: (key: string) => string;
};

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function HeroSection({ lang, isZh, translator }: HeroSectionProps) {
  const baseHero = ["rounded-[42px]", "border", "p-8", "md:p-10"];
  const zhHero = ["bg-zinc-900/70", "border-accent/60", "text-zinc-100"];
  const enHero = ["bg-white/90", "border-slate-200", "text-slate-900"];
  const badgeText = isZh ? "text-accent" : "text-slate-500";
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
  const secondaryVariantEn = ["border-slate-900", "text-slate-900"];
  return (
    <section className="space-y-8">
      <div className={joinClasses(...baseHero, ...(isZh ? zhHero : enHero))}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
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
                  isZh ? "text-zinc-200/70" : "text-slate-400"
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
              isZh ? "text-zinc-200/70" : "text-slate-500"
            )}
          >
            {translator("hero.support")}
          </p>
          <p
            className={joinClasses(
              "font-body",
              "text-base",
              "leading-7",
              isZh ? "text-zinc-200" : "text-slate-700"
            )}
          >
            {translator("hero.copy")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={localizedPath(lang, "products")}
              className={joinClasses(
                ...primaryButtonBase,
                ...(isZh ? primaryVariantZh : primaryVariantEn)
              )}
            >
              {translator("hero.cta.primary")}
            </Link>
            <a
              href="https://hostel-positano.com"
              target="_blank"
              rel="noreferrer"
              className={joinClasses(
                ...primaryButtonBase,
                "border",
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
