import type { FC } from "react";

import { TableHead, TableHeader, TableRow } from "@acme/design-system";

import clsx from "../../../../utils/clsx";
import { useMainContext } from "../../context";
import { useDaysRange } from "../../hooks";
import type { TDaysRange } from "../../interfaces/daysRange.interface";

import type { THeaderProps } from "./Header.interface";

const Header: FC<THeaderProps> = ({ title, info }) => {
  const {
    start,
    end,
    locale = "en",
    highlightToday,
    showInfo,
    selectedColumns,
  } = useMainContext();
  // `locale` from context can be either the locale key or the full locale
  // object. `useDaysRange` expects just the key, so normalise it here.
  const localeKey = typeof locale === "string" ? locale : "en";
  const range = useDaysRange(start, end, localeKey);

  const renderCell = (cell: TDaysRange, field: keyof TDaysRange) => {
    const { isWeekend } = cell;
    const isToday = highlightToday && cell.isToday;
    const isSelected =
      Array.isArray(selectedColumns) && selectedColumns.includes(cell.value);

    const className = clsx("rvg-cell", {
      weekend: isWeekend,
      today: !!isToday,
      selected: isSelected,
    });

    return (
      <TableHead
        key={cell.value}
        className={className}
        scope="col"
        data-testid={`cell-${field}-${cell.value}`}
      >
        {cell[field]}
      </TableHead>
    );
  };

  const clsTitle = clsx("rvg-title", "rvg-fixed");

  return (
    <TableHeader data-testid="header">
      <TableRow data-testid="row-days">
        <TableHead scope="col" rowSpan={2} className={clsTitle} data-testid="title">
          {" "}
          {title}
        </TableHead>
        {showInfo && (
          <TableHead scope="col" rowSpan={2} className="rvg-info" data-testid="info">
            {" "}
            {info}
          </TableHead>
        )}
        {range.map((cell: TDaysRange) => renderCell(cell, "day"))}
      </TableRow>
      <TableRow data-testid="row-dates">
        {range.map((cell: TDaysRange) => renderCell(cell, "date"))}
      </TableRow>
    </TableHeader>
  );
};

export { Header };
