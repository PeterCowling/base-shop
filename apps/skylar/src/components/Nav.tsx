'use client';

import Image from "next/image";
import Link from "next/link";
import { type Locale } from "@/lib/locales";
import { localizedPath, type Section } from "@/lib/routes";
import { useTranslations } from "@i18n";
import styles from "./Nav.module.css";

type NavProps = {
  lang: Locale;
  active: Section;
  isZh: boolean;
};

const NAV_ITEMS: Array<{ key: Section; labelKey: string }> = [
  { key: "products", labelKey: "nav.products" },
  { key: "realEstate", labelKey: "nav.realEstate" },
  { key: "people", labelKey: "nav.people" },
];

const LANGUAGES: Array<{ code: Locale; labelKey: string }> = [
  { code: "en", labelKey: "langLabel.en" },
  { code: "it", labelKey: "langLabel.it" },
  { code: "zh", labelKey: "langLabel.zh" },
];

type ClassValue = string | undefined | false | Array<string | undefined | false>;

function classNames(...classes: ClassValue[]) {
  return classes
    .flatMap((cls) => (Array.isArray(cls) ? cls : [cls]))
    .filter(Boolean)
    .join(" ");
}

export default function Nav({ lang, active, isZh }: NavProps) {
  const translator = useTranslations();
  const isIt = lang === "it";
  if (isIt) {
    return (
      <nav className={styles["nav"]} aria-label={translator("hero.headline")}>
        <div className={styles["navShell"]}>
          <div className={styles["identityBlock"]}>
            <Link
              href={localizedPath(lang, "home")}
              className={styles["identityLogoLink"]}
              aria-label={translator("hero.headline")}
            >
              <Image
                src="/en-logo.png"
                alt={translator("hero.headline")}
                width={168}
                height={64}
                className={styles["identityLogo"]}
                priority
              />
            </Link>
          </div>
          <div className={styles["navContent"]}>
            <div className={styles["linksRow"]}>
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === active;
                return (
                  <Link
                    key={`${item.key}-it`}
                    href={localizedPath(lang, item.key)}
                    className={classNames(styles["link"], isActive && styles["linkActive"])}
                  >
                    {translator(item.labelKey)}
                  </Link>
                );
              })}
            </div>
            <div className={styles["languageRow"]}>
              <span className={styles["languageLabel"]}>{translator("language.sectionLabel")}</span>
              <div className={styles["languageLinks"]}>
                {LANGUAGES.map((option) => {
                  const isActive = option.code === lang;
                  return (
                    <Link
                      key={`${option.code}-it`}
                      href={localizedPath(option.code, active)}
                      className={classNames(
                        styles["languageLink"],
                        isActive ? styles["languageLinkActive"] : styles["languageLinkInactive"]
                      )}
                    >
                      {translator(option.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  const navClass = classNames("loket-nav", isZh && "loket-nav--zh", isIt && "loket-nav--it");
  const logoSrc = isZh ? "/zh-logo.png" : "/en-logo.png";
  const logoClass = classNames("loket-logo__image", isZh && styles["zhLogo"]);
  return (
    <nav className={navClass}>
      <Link
        href={localizedPath(lang, "home")}
        className="loket-logo"
        aria-label={translator("hero.headline")}
      >
        <Image
          src={logoSrc}
          alt={translator("hero.headline")}
          width={200}
          height={148}
          className={logoClass}
          priority
        />
      </Link>
      <div className="loket-nav__center">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={localizedPath(lang, item.key)}
              className={classNames("loket-nav__link", isActive && "is-active")}
            >
              {translator(item.labelKey)}
            </Link>
          );
        })}
      </div>
      <div className="loket-nav__languages">
        {LANGUAGES.map((option) => {
          const isActive = option.code === lang;
          return (
            <Link
              key={option.code}
              href={localizedPath(option.code, active)}
              className={classNames("loket-nav__language", isActive && "is-active")}
            >
              {translator(option.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
