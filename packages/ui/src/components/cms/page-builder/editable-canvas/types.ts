import type { PageComponent, HistoryState } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "../state";
import type { DevicePreset } from "../../../../utils/devicePresets";

// i18n-exempt — builder-only surface; keep copy local
/* i18n-exempt */
export const t = (s: string) => s;

export type Viewport = "desktop" | "tablet" | "mobile";

export interface Props {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  insertIndex: number | null;
  insertParentId?: string | undefined;
  dispatch: (action: Action) => void;
  locale: Locale;
  containerStyle: React.CSSProperties;
  showGrid: boolean;
  gridCols: number;
  snapEnabled?: boolean;
  showRulers: boolean;
  viewport: Viewport;
  snapPosition: number | null;
  device?: DevicePreset;
  editor?: HistoryState["editor"];
  shop?: string | null;
  pageId?: string | null;
  showComments: boolean;
  zoom: number;
  showBaseline: boolean;
  baselineStep: number;
  dropAllowed?: boolean | null;
  preferParentOnClick?: boolean;
}

export type PBWindow = Window & { __PB_USER_ID?: string; __PB_USER_NAME?: string };

