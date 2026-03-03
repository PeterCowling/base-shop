"use client";

import { useUploaderI18n } from "../lib/uploaderI18n.client";

export function LanguageToggle({
  className,
  monoClassName,
  variant = "light",
}: {
  className?: string;
  monoClassName?: string;
  variant?: "light" | "dark";
}) {
  const { locale, setLocale, t } = useUploaderI18n();
  const rootClassName = [monoClassName ?? "", className ?? ""].filter(Boolean).join(" ");

  const isDark = variant === "dark";
  const wrapperClass = isDark
    ? "inline-flex overflow-hidden rounded-md border border-gate-header-border text-2xs uppercase tracking-label-lg text-gate-header-muted"
    : "inline-flex overflow-hidden rounded-md border border-border-2 bg-surface text-2xs uppercase tracking-label-lg text-gate-muted";

  const buttonClass = (active: boolean) => {
    if (isDark) {
      return `px-3 py-2 transition ${active ? "bg-gate-accent text-gate-on-accent" : "hover:bg-gate-accent/10 text-gate-header-muted"}`;
    }
    return `px-3 py-2 transition ${active ? "bg-gate-accent-soft text-gate-accent" : "hover:bg-muted text-gate-muted"}`;
  };

  return (
    <div className={rootClassName}>
      <span className="sr-only">{t("languageLabel")}</span>
      <div className={wrapperClass}>
        <button
          type="button"
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
          className={buttonClass(locale === "en")}
        >
          {t("languageEnglish")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("zh")}
          aria-pressed={locale === "zh"}
          className={buttonClass(locale === "zh")}
        >
          {t("languageZh")}
        </button>
      </div>
    </div>
  );
}
