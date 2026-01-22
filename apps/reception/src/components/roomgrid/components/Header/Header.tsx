import type { FC } from "react";

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
      <th
        key={cell.value}
        className={className}
        scope="col"
        data-testid={`cell-${field}-${cell.value}`}
      >
        {cell[field]}
      </th>
    );
  };

  const clsTitle = clsx("rvg-title", "rvg-fixed");

  return (
    <thead data-testid="header">
      <tr data-testid="row-days">
        <th scope="col" rowSpan={2} className={clsTitle} data-testid="title">
          {" "}
          {title}
        </th>
        {showInfo && (
          <th scope="col" rowSpan={2} className="rvg-info" data-testid="info">
            {" "}
            {info}
          </th>
        )}
        {range.map((cell: TDaysRange) => renderCell(cell, "day"))}
      </tr>
      <tr data-testid="row-dates">
        {range.map((cell: TDaysRange) => renderCell(cell, "date"))}
      </tr>
    </thead>
  );
};

export { Header };
