// Copied from src/components/rooms/RoomFilters.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Inline } from "../components/atoms/primitives/Inline";

export type RoomFilterView = "all" | "sea" | "courtyard" | "garden" | "none";
export type RoomFiltersState = {
  view: RoomFilterView;
  femaleOnly: boolean;
  ensuiteBathroom: boolean;
  bedCounts: number[];
};

interface RoomFiltersProps {
  selected: RoomFiltersState;
  onChange: (filters: RoomFiltersState) => void;
  availableBedCounts: number[];
  lang?: string;
}

const VIEW_FALLBACK_LABELS: Record<RoomFilterView, string> = {
  all: "All views",
  sea: "Sea view",
  courtyard: "Courtyard",
  garden: "Garden",
  none: "No view",
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

function RoomFilters({ selected, onChange, availableBedCounts, lang }: RoomFiltersProps): JSX.Element {
  const { t } = useTranslation("roomsPage", { lng: lang });
  const viewFilters: RoomFilterView[] = ["all", "sea", "courtyard", "garden", "none"];
  const activeClass =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-primary text-brand-on-primary border-brand-primary dark:bg-brand-secondary dark:text-brand-on-accent dark:border-brand-secondary";
  const inactiveClass =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-bg text-brand-primary border-brand-primary hover:bg-brand-primary/10 dark:bg-brand-bg dark:text-brand-text dark:border-brand-secondary/60 dark:hover:bg-brand-secondary/20";

  return (
    <div className="mb-6 space-y-3">
      <Inline
        role="radiogroup"
        aria-label={resolveTranslatedCopy(t("filtersAria", { defaultValue: "Room filters" }), "Room filters")}
        gap={2}
        className="justify-center"
      >
        {viewFilters.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected.view === key}
            className={`min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${
              selected.view === key ? activeClass : inactiveClass
            }`}
            onClick={() => onChange({ ...selected, view: key })}
          >
            {resolveTranslatedCopy(
              t(`filters.views.${key}`, { defaultValue: VIEW_FALLBACK_LABELS[key] }),
              VIEW_FALLBACK_LABELS[key]
            )}
          </button>
        ))}
      </Inline>
      <Inline role="group" aria-label="Room attributes" gap={2} className="justify-center">
        <button
          type="button"
          aria-pressed={selected.femaleOnly}
          className={`min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${
            selected.femaleOnly ? activeClass : inactiveClass
          }`}
          onClick={() => onChange({ ...selected, femaleOnly: !selected.femaleOnly })}
        >
          {resolveTranslatedCopy(
            t("filters.femaleOnly", { defaultValue: "Female only" }),
            "Female only"
          )}
        </button>
        <button
          type="button"
          aria-pressed={selected.ensuiteBathroom}
          className={`min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${
            selected.ensuiteBathroom ? activeClass : inactiveClass
          }`}
          onClick={() => onChange({ ...selected, ensuiteBathroom: !selected.ensuiteBathroom })}
        >
          {resolveTranslatedCopy(
            t("filters.ensuiteBathroom", { defaultValue: "Ensuite / private bathroom" }),
            "Ensuite / private bathroom"
          )}
        </button>
      </Inline>
      <Inline role="group" aria-label="Bed count" gap={2} className="justify-center">
        {availableBedCounts.map((count) => {
          const isActive = selected.bedCounts.includes(count);
          return (
            <button
              key={count}
              type="button"
              aria-pressed={isActive}
              className={`min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${
                isActive ? activeClass : inactiveClass
              }`}
              onClick={() =>
                onChange({
                  ...selected,
                  bedCounts: isActive
                    ? selected.bedCounts.filter((value) => value !== count)
                    : [...selected.bedCounts, count].sort((a, b) => a - b),
                })
              }
            >
              {resolveTranslatedCopy(
                t("filters.bedCount", { defaultValue: "{{count}} beds", count }),
                `${count} beds`
              )}
            </button>
          );
        })}
      </Inline>
    </div>
  );
}

export { RoomFilters };
export default memo(RoomFilters);
