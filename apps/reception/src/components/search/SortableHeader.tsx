// /src/components/bookingSearch/SortableHeader.tsx
import React from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
} from "lucide-react";

import { TableHead } from "@acme/design-system";

import clsx from "../../utils/clsx";

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
  /** Additional <TableHead> classes */
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
    if (currentField !== field) return ChevronsUpDown;
    return ascending ? ChevronUp : ChevronDown;
  }, [currentField, field, ascending]);

  return (
    <TableHead
      scope="col"
      onClick={() => onSort(field)}
      className={clsx(
        "select-none whitespace-nowrap px-3 py-2 font-semibold text-sm text-foreground " +
          "border-b border-border cursor-pointer transition-colors hover:text-primary-main",
        className
      )}
    >
      <span className="flex items-center gap-1">
        {label}
        <Icon className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      </span>
    </TableHead>
  );
};

export default React.memo(SortableHeader);
