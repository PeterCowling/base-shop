// Copied from src/components/rooms/RoomFilters.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Inline } from "../components/atoms/primitives/Inline";

export type RoomFilter = "all" | "private" | "dorms";

interface RoomFiltersProps {
  selected: RoomFilter;
  onChange: (filter: RoomFilter) => void;
  lang?: string;
}

const FILTER_FALLBACK_LABELS: Record<RoomFilter, string> = {
  all: "All",
  private: "Private",
  dorms: "Dorms",
};

function looksLikeI18nKeyToken(value: string): boolean {
  if (!value.includes(".")) return false;
  const parts = value.split(".");
  if (parts.length < 2) return false;
  for (const part of parts) {
    if (!part) return false;
    for (let i = 0; i < part.length; i += 1) {
      const code = part.charCodeAt(i);
      const isLowerAlpha = code >= 97 && code <= 122;
      const isUpperAlpha = code >= 65 && code <= 90;
      const isDigit = code >= 48 && code <= 57;
      const isUnderscore = code === 95;
      if (!isLowerAlpha && !isUpperAlpha && !isDigit && !isUnderscore) {
        return false;
      }
    }
  }
  return true;
}

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (looksLikeI18nKeyToken(trimmed)) return fallback;
  return trimmed;
}

function RoomFilters({ selected, onChange, lang }: RoomFiltersProps): JSX.Element {
  const { t } = useTranslation("roomsPage", { lng: lang });
  const filters: RoomFilter[] = ["all", "private", "dorms"];
  const activeClass =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-primary text-primary-fg border-brand-primary dark:bg-brand-secondary dark:text-brand-bg dark:border-brand-secondary";
  const inactiveClass =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-bg text-brand-primary border-brand-primary hover:bg-brand-primary/10 dark:bg-brand-bg dark:text-brand-text dark:border-brand-secondary/60 dark:hover:bg-brand-secondary/20";

  return (
    <Inline
      role="radiogroup"
      aria-label={resolveTranslatedCopy(t("filtersAria", { defaultValue: "Room type filters" }), "Room type filters")}
      gap={2}
      className="mb-6 justify-center"
    >
      {filters.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={selected === key}
          className={`min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${
            selected === key ? activeClass : inactiveClass
          }`}
          onClick={() => onChange(key)}
        >
          {resolveTranslatedCopy(
            t(`filters.${key}`, { defaultValue: FILTER_FALLBACK_LABELS[key] }),
            FILTER_FALLBACK_LABELS[key]
          )}
        </button>
      ))}
    </Inline>
  );
}

export { RoomFilters };
export default memo(RoomFilters);
