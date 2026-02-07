// src/libs/reservation-grid/src/lib/components/Grid/Grid.tsx

import { useEffect, useState } from "react";

import { MainProvider } from "../../context";
import type { TMainContext } from "../../interfaces/mainContext.interface";
import type { TRow } from "../../interfaces/row";
import type { TTheme } from "../../interfaces/theme.interface";
import { styleUtils } from "../Day/utils/styleUtils";
import { Header } from "../Header";
import { Row as VisualRow } from "../Row";

import type { TGridProps } from "./Grid.interface";

function Grid<TCustomStatus extends string = never>(
  props: TGridProps<TCustomStatus>
) {
  const {
    start,
    end,
    title = "Room",
    info = "",
    highlightToday = true,
    showInfo = true,
    selectedColumns = [],
    selectedRows = [],
    data,
    theme,
    renderTitle,
    renderInfo,
    locale = "en",
    onClickTitle,
    onClickCell,
    // --- DND Props ---
    roomNumber, // Destructure new prop
    onReservationMove, // Destructure new prop
    // --- End DND Props ---
  } = props;

  const [customTheme, setCustomTheme] = useState<TTheme<TCustomStatus>>(
    styleUtils.createTheme<TCustomStatus>(theme ?? {})
  );

  useEffect(() => {
    const newTheme = styleUtils.createTheme<TCustomStatus>(theme ?? {});
    setCustomTheme(newTheme);
    styleUtils.setVariables(newTheme);
  }, [theme]);

  // Add new props to context value
  const contextValue: TMainContext<TCustomStatus> = {
    start,
    end,
    highlightToday,
    showInfo,
    selectedColumns,
    selectedRows,
    theme: customTheme,
    locale: locale || "en",
    onClickTitle,
    onClickCell,
    // --- DND Props ---
    roomNumber,
    onReservationMove,
    // --- End DND Props ---
  };

  const renderRow = (row: TRow<TCustomStatus>) => {
    const isSelected =
      Array.isArray(selectedRows) && selectedRows.includes(row.id);
    const title = renderTitle ? renderTitle(row) : row.title;
    const info = renderInfo ? renderInfo(row) : row.info;

    return (
      <VisualRow // Use the imported name
        key={row.id}
        id={row.id}
        title={title}
        info={info}
        periods={row.periods}
        selected={isSelected}
        // No need to pass roomNumber/onReservationMove here, they are in context
      />
    );
  };

  return (
    <MainProvider value={contextValue}>
      {" "}
      {/* Pass the updated context value */}
      <div className="rvg-wrapper" data-testid="grid-wrapper">
        <table className="rvg-table">
          <Header title={title} info={info} />
          <tbody>{data.map((row) => renderRow(row))}</tbody>
        </table>
      </div>
    </MainProvider>
  );
}

export { Grid };
