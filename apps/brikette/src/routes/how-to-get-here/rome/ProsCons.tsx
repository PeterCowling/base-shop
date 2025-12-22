import { memo } from "react";
import { useTranslation } from "react-i18next";

interface ProsConsProps {
  prosKeys: string[];
  consKeys: string[];
}

function ProsConsBase({ prosKeys, consKeys }: ProsConsProps) {
  const { t } = useTranslation("howToGetHere");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{t("romePlanner.ui.pros")}</div>
        <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-surface/80">
          {prosKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{t("romePlanner.ui.cons")}</div>
        <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-surface/80">
          {consKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const ProsCons = memo(ProsConsBase);
