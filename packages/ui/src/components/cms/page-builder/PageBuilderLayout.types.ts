import type { CSSProperties, ComponentProps, RefObject, ReactNode } from "react";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import type { Step, CallBackProps } from "./PageBuilderTour";
import type { ComponentType } from "./defaults";
import type { DragMeta } from "./DragOverlayPreview";

// eslint-disable-next-line ds/no-hardcoded-copy -- DS-1234: type-only import specifier; not user-facing copy
type DndContextComponent = typeof import("@dnd-kit/core").DndContext;
type PageToolbarComponent = typeof import("./PageToolbar").default;
type GridSettingsComponent = typeof import("./GridSettings").default;
type PageCanvasComponent = typeof import("./PageCanvas").default;
type HistoryControlsComponent = typeof import("./HistoryControls").default;
type PageSidebarComponent = typeof import("./PageSidebar").default;

export interface PageBuilderLayoutProps {
  style?: CSSProperties;
  paletteOnAdd: (type: ComponentType) => void;
  onInsertImageAsset: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onInsertPreset?: (component: PageComponent) => void;
  onInsertLinkedSection?: (item: { globalId: string; label: string; component: PageComponent }) => void;
  presetsSourceUrl?: string;
  toolbarProps: ComponentProps<PageToolbarComponent>;
  gridProps: ComponentProps<GridSettingsComponent>;
  startTour: () => void;
  togglePreview: () => void;
  showPreview: boolean;
  toggleComments: () => void;
  showComments: boolean;
  liveMessage: string;
  dndContext: ComponentProps<DndContextComponent>;
  dropAllowed?: boolean | null;
  dragMeta?: DragMeta | null;
  frameClass: Record<string, string>;
  viewport: "desktop" | "tablet" | "mobile";
  viewportStyle: CSSProperties;
  zoom?: number;
  scrollRef?: RefObject<HTMLDivElement | null>;
  canvasProps: ComponentProps<PageCanvasComponent>;
  activeType: ComponentType | null;
  previewProps: {
    components: PageComponent[];
    locale: Locale;
    deviceId: string;
    onChange: (id: string) => void;
  };
  historyProps: ComponentProps<HistoryControlsComponent>;
  sidebarProps: ComponentProps<PageSidebarComponent>;
  toast: { open: boolean; message: string; retry?: () => void; onClose: () => void };
  tourProps: { steps: Step[]; run: boolean; callback: (data: CallBackProps) => void };
  shop?: string | null;
  pageId?: string | null;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  editingSizePx?: number | null;
  setEditingSizePx?: (px: number | null) => void;
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  // i18n-exempt: type-only string literal union
  mode?: "page" | "section";
  // Presets authoring (save selected Section as preset)
  canSavePreset?: boolean;
  onSavePreset?: () => void;
  templateActions?: ReactNode;
  allowedBlockTypes?: Set<ComponentType>;
  publishMeta?: {
    status: "draft" | "published";
    updatedAt?: string;
    publishedAt?: string;
    publishedBy?: string;
    publishedRevisionId?: string;
    currentRevisionId?: string;
    lastPublishedComponents?: PageComponent[];
  };
  previewUrl?: string | null;
  previewSource?: string | null;
}
