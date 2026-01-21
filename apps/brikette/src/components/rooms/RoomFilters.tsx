// src/components/rooms/RoomFilters.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

export type RoomFilter = "all" | "private" | "dorms";

interface RoomFiltersProps {
  selected: RoomFilter;
  onChange: (filter: RoomFilter) => void;
  lang?: string;
}

type InlineProps = JSX.IntrinsicElements["div"];

function Inline({ className, ...props }: InlineProps): JSX.Element {
  return <div className={clsx("flex", className)} {...props} />;
}

const BASE_BUTTON_CLASSES = [
  "rounded-full",
  "border",
  "px-3",
  "py-1",
  "text-sm",
  "transition-colors",
  "duration-200",
] as const;

const SELECTED_BUTTON_CLASSES = [
  "border-brand-primary",
  "bg-brand-primary",
  "text-brand-bg",
] as const;

const IDLE_BUTTON_CLASSES = [
  "border-brand-primary",
  "bg-brand-bg",
  "text-brand-primary",
  "hover:bg-brand-primary/10",
] as const;

function RoomFilters({ selected, onChange, lang }: RoomFiltersProps): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("roomsPage", translationOptions);
  const filters: RoomFilter[] = ["all", "private", "dorms"];

  return (
    <Inline
      role="radiogroup"
      aria-label={t("filtersAria")}
      className="mb-6 justify-center gap-2"
    >
      {filters.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={selected === key}
          className={clsx(
            BASE_BUTTON_CLASSES,
            selected === key ? SELECTED_BUTTON_CLASSES : IDLE_BUTTON_CLASSES
          )}
          onClick={() => onChange(key)}
        >
          {t(`filters.${key}`)}
        </button>
      ))}
    </Inline>
  );
}

export default memo(RoomFilters);
