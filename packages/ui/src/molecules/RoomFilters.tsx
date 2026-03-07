import { memo } from "react";
import { useTranslation } from "react-i18next";

export type RoomFilterView = "all" | "sea" | "courtyard" | "garden" | "none";
export type RoomFiltersState = {
  view: RoomFilterView;
  femaleOnly: boolean;
  ensuiteBathroom: boolean;
  bedCounts: number[];
};

export type FilterAvailability = {
  views: Record<RoomFilterView, boolean>;
  femaleOnly: boolean;
  ensuiteBathroom: boolean;
  bedCounts: Record<number, boolean>;
};

interface RoomFiltersProps {
  selected: RoomFiltersState;
  onChange: (filters: RoomFiltersState) => void;
  availableBedCounts: number[];
  availability: FilterAvailability;
  lang?: string;
}

const VIEW_FALLBACK_LABELS: Record<RoomFilterView, string> = {
  all: "All views",
  sea: "Sea view",
  courtyard: "Courtyard",
  garden: "Garden",
  none: "No view",
};

const VIEW_EXISTING_TRANSLATION_KEYS: Record<RoomFilterView, string> = {
  all: "filters.all",
  sea: "detailsLine.views.seaViewTerrace",
  courtyard: "detailsLine.views.courtyardView",
  garden: "detailsLine.views.gardenView",
  none: "detailsLine.views.noView",
};

const CATEGORY_FALLBACK_LABELS: Record<string, string> = {
  view: "View",
  type: "Type",
  beds: "Beds",
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

function resolveTranslatedChain(
  values: unknown[],
  fallback: string,
): string {
  for (const value of values) {
    const resolved = resolveTranslatedCopy(value, "");
    if (resolved) return resolved;
  }

  return fallback;
}

/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
const activeClass =
  "bg-brand-primary text-brand-on-primary border-brand-primary dark:bg-brand-secondary dark:text-brand-on-accent dark:border-brand-secondary";
/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
const inactiveClass =
  "bg-brand-bg text-brand-primary border-brand-primary hover:bg-brand-primary/10 dark:bg-brand-bg dark:text-brand-text dark:border-brand-secondary/60 dark:hover:bg-brand-secondary/20";
/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
const disabledClass =
  "bg-brand-bg text-brand-primary/40 border-brand-primary/25 cursor-not-allowed dark:bg-brand-bg dark:text-brand-text/30 dark:border-brand-secondary/20";

function RoomFilters({ selected, onChange, availableBedCounts, availability, lang }: RoomFiltersProps): JSX.Element {
  const { t } = useTranslation("roomsPage", { lng: lang });
  const viewFilters: RoomFilterView[] = ["all", "sea", "courtyard", "garden", "none"];

  function pillClass(isActive: boolean, isDisabled: boolean): string {
    if (isDisabled) return `min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${disabledClass}`;
    return `min-h-11 rounded-full px-4 py-2 text-sm border transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`;
  }

  const viewLabel = resolveTranslatedChain(
    [
      t("filters.categories.view"),
      t("feature.view"),
    ],
    CATEGORY_FALLBACK_LABELS.view,
  );
  const typeLabel = resolveTranslatedChain(
    [
      t("filters.categories.type"),
      t("details"),
    ],
    CATEGORY_FALLBACK_LABELS.type,
  );
  const bedsLabel = resolveTranslatedChain(
    [
      t("filters.categories.beds"),
      t("feature.beds"),
    ],
    CATEGORY_FALLBACK_LABELS.beds,
  );
  const filtersAriaLabel = resolveTranslatedChain(
    [t("filtersAria")],
    "Room filters",
  );
  const roomAttributesAriaLabel = resolveTranslatedChain(
    [
      t("filters.categories.type"),
      t("details"),
    ],
    "Room attributes",
  );
  const bedCountAriaLabel = resolveTranslatedChain(
    [
      t("filters.categories.beds"),
      t("feature.beds"),
    ],
    "Bed count",
  );

  return (
    <div className="mb-6 space-y-2">
      {/* View row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-12 shrink-0 text-xs font-medium uppercase tracking-wider text-brand-primary/60 dark:text-brand-text/50">
          {viewLabel}
        </span>
        <div role="radiogroup" aria-label={filtersAriaLabel} className="flex flex-wrap gap-2">
          {viewFilters.map((key) => {
            const isActive = selected.view === key;
            const isDisabled = !availability.views[key];
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-disabled={isDisabled || undefined}
                className={pillClass(isActive, isDisabled)}
                onClick={isDisabled ? undefined : () => onChange({ ...selected, view: key })}
              >
                {resolveTranslatedChain(
                  [
                    t(`filters.views.${key}`),
                    t(VIEW_EXISTING_TRANSLATION_KEYS[key]),
                  ],
                  VIEW_FALLBACK_LABELS[key],
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-12 shrink-0 text-xs font-medium uppercase tracking-wider text-brand-primary/60 dark:text-brand-text/50">
          {typeLabel}
        </span>
        <div role="group" aria-label={roomAttributesAriaLabel} className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={selected.femaleOnly}
            aria-disabled={!availability.femaleOnly || undefined}
            className={pillClass(selected.femaleOnly, !availability.femaleOnly)}
            onClick={!availability.femaleOnly ? undefined : () => onChange({ ...selected, femaleOnly: !selected.femaleOnly })}
          >
            {resolveTranslatedChain(
              [
                t("filters.femaleOnly"),
                t("facts.type.femaleDorm"),
                t("facts.type.femaleRoom"),
              ],
              "Female only",
            )}
          </button>
          <button
            type="button"
            aria-pressed={selected.ensuiteBathroom}
            aria-disabled={!availability.ensuiteBathroom || undefined}
            className={pillClass(selected.ensuiteBathroom, !availability.ensuiteBathroom)}
            onClick={!availability.ensuiteBathroom ? undefined : () => onChange({ ...selected, ensuiteBathroom: !selected.ensuiteBathroom })}
          >
            {resolveTranslatedChain(
              [
                t("filters.ensuiteBathroom"),
                t("facts.bathroom.bathroomEnsuite"),
                t("facts.bathroom.bathroomPrivate"),
              ],
              "Ensuite / private bathroom",
            )}
          </button>
        </div>
      </div>

      {/* Beds row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-12 shrink-0 text-xs font-medium uppercase tracking-wider text-brand-primary/60 dark:text-brand-text/50">
          {bedsLabel}
        </span>
        <div role="group" aria-label={bedCountAriaLabel} className="flex flex-wrap gap-2">
          {availableBedCounts.map((count) => {
            const isActive = selected.bedCounts.includes(count);
            const isDisabled = availability.bedCounts[count] === false;
            return (
              <button
                key={count}
                type="button"
                aria-pressed={isActive}
                aria-disabled={isDisabled || undefined}
                className={pillClass(isActive, isDisabled)}
                onClick={
                  isDisabled
                    ? undefined
                    : () =>
                        onChange({
                          ...selected,
                          bedCounts: isActive
                            ? selected.bedCounts.filter((value) => value !== count)
                            : [...selected.bedCounts, count].sort((a, b) => a - b),
                        })
                }
              >
                {resolveTranslatedChain(
                  [
                    t("filters.bedCount", { count }),
                    t("feature.beds", { defaultValue: "Beds" }).replace(/^/u, `${count} `),
                  ],
                  `${count} beds`,
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { RoomFilters };
export default memo(RoomFilters);
