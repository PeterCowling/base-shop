// /src/components/bookingSearch/SortableHeader.tsx
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import clsx from "../../utils/clsx";
import React from "react";

export interface SortableHeaderProps {
  /** Display label (already i18n‑translated) */
  label: string;
  /** Field name used in the parent’s sort state */
  field: string;
  /** Current sort field */
  currentField: string;
  /** Current sort direction */
  ascending: boolean;
  /** Callback to mutate parent sort state */
  onSort: (field: string) => void;
  /** Additional <th> classes */
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentField,
  ascending,
  onSort,
  className = "",
}) => {
  /** Which icon should appear */
  const Icon = React.useMemo(() => {
    if (currentField !== field) return ChevronUpDownIcon;
    return ascending ? ChevronUpIcon : ChevronDownIcon;
  }, [currentField, field, ascending]);

  return (
    <th
      scope="col"
      onClick={() => onSort(field)}
      className={clsx(
        "select-none whitespace-nowrap px-3 py-2 font-semibold text-sm text-gray-700 " +
          "border-b border-gray-200 cursor-pointer transition-colors hover:text-primary-600 dark:border-darkSurface dark:text-darkAccentGreen",
        className
      )}
    >
      <span className="flex items-center gap-1">
        {label}
        <Icon className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      </span>
    </th>
  );
};

export default React.memo(SortableHeader);
