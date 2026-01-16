import type { ReactNode } from "react";

import type { TLocaleKey } from "../../interfaces/locale.interface";
import type { TMainContext } from "../../interfaces/mainContext.interface";
import type { TRow } from "../../interfaces/row";
import type { TTheme } from "../../interfaces/theme.interface";

type TGridProps<TCustomStatus extends string = never> = Omit<
  TMainContext<TCustomStatus>,
  "theme" | "locale"
> & {
  title?: string;
  info?: string;
  data: TRow<TCustomStatus>[];
  theme?: Partial<TTheme<TCustomStatus>>;
  locale?: TLocaleKey;
  renderTitle?: (row: TRow<TCustomStatus>) => ReactNode;
  renderInfo?: (row: TRow<TCustomStatus>) => ReactNode;
};

export type { TGridProps };
