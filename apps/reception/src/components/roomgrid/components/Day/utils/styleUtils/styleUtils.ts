// src/libs/reservation-grid/src/lib/utils/styleUtils/styleUtils.ts

import { THEME } from "../../../../constants/theme";
import type { TTheme } from "../../../../interfaces/theme.interface";

function createTheme<TCustomStatus extends string = never>(
  customTheme: Partial<TTheme<TCustomStatus>> = {}
): TTheme<TCustomStatus> {
  const dateStatus = {
    ...THEME["date.status"],
    ...(customTheme["date.status"] ? { ...customTheme["date.status"] } : {}),
  } as TTheme<TCustomStatus>["date.status"];

  const theme: TTheme<TCustomStatus> = {
    ...THEME,
    ...customTheme,
    "date.status": dateStatus,
  };

  return theme;
}

function setVariables<TCustomStatus extends string = never>(
  customTheme: TTheme<TCustomStatus>
): void {
  const root = document.documentElement;

  for (const entry of Object.entries(customTheme)) {
    const [key, value] = entry;
    if (key === "date.status") {
      continue;
    }

    const variable = `--rvg-${key.replace(".", "-")}`;
    root.style.setProperty(variable, value);
  }

  for (const entry of Object.entries(customTheme["date.status"])) {
    const [key, value] = entry;
    const variable = `--rvg-date-status-${key}`;
    root.style.setProperty(variable, value);
  }
}

const styleUtils = {
  createTheme,
  setVariables,
};

export { styleUtils };
