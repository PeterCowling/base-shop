import { THEME } from "../../constants/theme";
import { useMainContext } from "../../context";
import type { TTheme } from "../../interfaces/theme.interface";

function useTheme<
  TCustomStatus extends string = never
>(): TTheme<TCustomStatus> {
  const { theme } = useMainContext<TCustomStatus>();
  return (theme || THEME) as TTheme<TCustomStatus>;
}

export { useTheme };
