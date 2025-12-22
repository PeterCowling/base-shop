// src/components/guides/EventInfo.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";

type Props = {
  date?: string;
  location?: string;
  tips?: string[];
  className?: string;
  lang?: AppLanguage;
};

function EventInfo({ date, location, tips = [], className = "", lang: explicitLang }: Props): JSX.Element | null {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t } = useTranslation("guides", { lng: lang });

  const infoItems = [
    {
      label: t("components.eventInfo.labels.when"),
      value: typeof date === "string" && date.trim().length > 0 ? date : undefined,
    },
    {
      label: t("components.eventInfo.labels.where"),
      value: typeof location === "string" && location.trim().length > 0 ? location : undefined,
    },
  ].filter((item) => Boolean(item.value));

  const safeTips = tips.filter((tip): tip is string => typeof tip === "string" && tip.trim().length > 0);

  if (infoItems.length === 0 && safeTips.length === 0) {
    return null;
  }

  return (
    <aside className={`not-prose my-6 rounded-md border border-slate-200 p-4 dark:border-slate-700 ${className}`}>
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {t("components.eventInfo.title")}
      </p>
      {infoItems.length > 0 ? (
        <dl className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {infoItems.map((item) => (
            <div key={item.label} className="space-y-0.5">
              <dt className="font-medium text-slate-800 dark:text-slate-100">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {safeTips.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
          {safeTips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

export default memo(EventInfo);

