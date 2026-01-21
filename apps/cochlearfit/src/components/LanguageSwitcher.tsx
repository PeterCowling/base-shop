"use client";

import React, { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTranslations } from "@acme/i18n";

import Inline from "@/components/layout/Inline";
import { useLocale } from "@/contexts/LocaleContext";
import { setPreferredLocale } from "@/lib/localePreference";
import { LOCALES } from "@/lib/locales";
import { replaceLocaleInPath } from "@/lib/routes";
import type { Locale } from "@/types/locale";

type LocaleButtonProps = {
  locale: Locale;
  isActive: boolean;
  onSelect: (locale: Locale) => void;
  label: string;
};

const LocaleButton = React.memo(function LocaleButton({
  locale,
  isActive,
  onSelect,
  label,
}: LocaleButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(locale);
  }, [locale, onSelect]);
  const activeClasses = [
    "rounded-full",
    "bg-primary",
    "px-3",
    "py-1",
    "text-xs",
    "font-semibold",
    "uppercase",
    "tracking-widest",
    "text-primary-foreground",
  ];
  const inactiveClasses = [
    "rounded-full",
    "border",
    "border-border-1",
    "px-3",
    "py-1",
    "text-xs",
    "font-semibold",
    "uppercase",
    "tracking-widest",
    "text-muted-foreground",
    "transition",
    "hover:border-primary/60",
    "hover:text-accent",
  ];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={(isActive ? activeClasses : inactiveClasses).join(" ")}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
});

export default function LanguageSwitcher() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const options = useMemo(() => LOCALES, []);

  const handleSelect = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === currentLocale) return;
      setPreferredLocale(nextLocale);
      const nextPath = replaceLocaleInPath(pathname ?? "/", nextLocale);
      router.push(nextPath);
    },
    [currentLocale, pathname, router]
  );

  return (
    <Inline className="items-center gap-2" aria-label={t("language.switch") as string}>
      {options.map((locale) => (
        <LocaleButton
          key={locale}
          locale={locale}
          isActive={locale === currentLocale}
          onSelect={handleSelect}
          label={locale}
        />
      ))}
    </Inline>
  );
}
