import type { ReactElement, ReactNode } from "react";
import { createContext, useContext } from "react";

import { dateUtils } from "../../../utils/dateUtils";
import { THEME } from "../constants/theme";
import type { TMainContext } from "../interfaces/mainContext.interface";

const today = dateUtils.format(new Date());

const initialValue: TMainContext<never> = {
  start: dateUtils.startOf(today, "month"),
  end: dateUtils.endOf(today, "month"),
  highlightToday: true,
  showInfo: true,
  selectedColumns: [],
  selectedRows: [],
  theme: THEME,
  locale: "en",
};

const mainContext = createContext<TMainContext<never>>(initialValue);

interface TProps<TCustomStatus extends string = never> {
  value: TMainContext<TCustomStatus>;

  children: ReactNode;
}

const MainProvider = <TCustomStatus extends string = never>({
  value,
  children,
}: TProps<TCustomStatus>): ReactElement => (
  <mainContext.Provider value={value}>{children}</mainContext.Provider>
);

const useMainContext = <
  TCustomStatus extends string = never
>(): TMainContext<TCustomStatus> =>
  useContext(mainContext) as TMainContext<TCustomStatus>;

export { initialValue, MainProvider, useMainContext };
