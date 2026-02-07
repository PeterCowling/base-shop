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

function RoomFilters({ selected, onChange, lang }: RoomFiltersProps): JSX.Element {
  const { t } = useTranslation("roomsPage", { lng: lang });
  const filters: RoomFilter[] = ["all", "private", "dorms"];
  const activeClass =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-primary text-brand-bg border-brand-primary";
  const inactiveClass =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-bg text-brand-primary border-brand-primary hover:bg-brand-primary/10";

  return (
    <Inline role="radiogroup" aria-label={t("filtersAria")} gap={2} className="mb-6 justify-center">
      {filters.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={selected === key}
          className={`rounded-full px-3 py-1 text-sm border transition-colors duration-200 ${
            selected === key ? activeClass : inactiveClass
          }`}
          onClick={() => onChange(key)}
        >
          {t(`filters.${key}`)}
        </button>
      ))}
    </Inline>
  );
}

export { RoomFilters };
export default memo(RoomFilters);
