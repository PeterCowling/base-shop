"use client";

/* eslint-disable ds/no-raw-typography, ds/no-arbitrary-tailwind -- XAUP-0001 [ttl=2026-12-31] Gate UI pending design token refactor */

import { useUploaderI18n } from "../lib/uploaderI18n.client";

export function LanguageToggle({
  className,
  monoClassName,
}: {
  className?: string;
  monoClassName?: string;
}) {
  const { locale, setLocale, t } = useUploaderI18n();
  const rootClassName = [monoClassName ?? "", className ?? ""].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <span className="sr-only">{t("languageLabel")}</span>
      <div className="inline-flex overflow-hidden rounded-md border border-border-2 bg-white text-[10px] uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
        <button
          type="button"
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
          className={`px-3 py-2 transition ${
            locale === "en"
              ? "bg-muted text-[color:var(--gate-ink)]"
              : "hover:bg-muted"
          }`}
        >
          {t("languageEnglish")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("zh")}
          aria-pressed={locale === "zh"}
          className={`px-3 py-2 transition ${
            locale === "zh"
              ? "bg-muted text-[color:var(--gate-ink)]"
              : "hover:bg-muted"
          }`}
        >
          {t("languageChinese")}
        </button>
      </div>
    </div>
  );
}
