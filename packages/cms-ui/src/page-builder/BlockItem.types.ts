import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/types";
import type { DevicePreset } from "@acme/ui/utils/devicePresets";

import type { Action } from "./state";

export type BlockItemProps = {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
  parentType?: string;
  parentSlots?: number;
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  editor?: HistoryState["editor"];
  zoom?: number;
  baselineSnap?: boolean;
  baselineStep?: number;
  dropAllowed?: boolean | null;
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  preferParentOnClick?: boolean;
};
