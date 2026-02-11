import { memo } from "react";
import { useTranslation } from "react-i18next";

interface ProsConsProps {
  prosKeys: string[];
  consKeys: string[];
}

function resolveTranslatedCopy(value: unknown, key: string, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  return trimmed;
}

function ProsConsBase({ prosKeys, consKeys }: ProsConsProps) {
  const { t } = useTranslation("howToGetHere");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="text-sm font-semibold text-brand-heading dark:text-brand-text">
          {resolveTranslatedCopy(t("romePlanner.ui.pros", { defaultValue: "Pros" }), "romePlanner.ui.pros", "Pros")}
        </div>
        <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-text/80">
          {prosKeys.map((key) => (
            <li key={key}>{resolveTranslatedCopy(t(key), key)}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-sm font-semibold text-brand-heading dark:text-brand-text">
          {resolveTranslatedCopy(t("romePlanner.ui.cons", { defaultValue: "Cons" }), "romePlanner.ui.cons", "Cons")}
        </div>
        <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-text/80">
          {consKeys.map((key) => (
            <li key={key}>{resolveTranslatedCopy(t(key), key)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const ProsCons = memo(ProsConsBase);
