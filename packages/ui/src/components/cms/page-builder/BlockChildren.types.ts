import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/types";

import type { DevicePreset } from "../../../utils/devicePresets";

import type { Action } from "./state";

export interface BlockChildrenProps {
  component: PageComponent;
  childComponents?: PageComponent[];
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  isOver: boolean;
  setDropRef: (node: HTMLDivElement | null) => void;
  editor?: HistoryState["editor"];
  baselineSnap?: boolean;
  baselineStep?: number;
  dropAllowed?: boolean | null;
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  preferParentOnClick?: boolean;
}

export type SlotDef = { key: string; title: string };
