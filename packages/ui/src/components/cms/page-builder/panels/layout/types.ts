// packages/ui/src/components/cms/page-builder/panels/layout/types.ts
import type { PageComponent, HistoryState } from "@acme/types";

// Local copy to avoid package export mismatch (same as original file)
export type EditorFlags = {
  name?: string;
  locked?: boolean;
  zIndex?: number;
  hidden?: ("desktop" | "tablet" | "mobile")[];
  // Per-element responsive behavior (builder-only flag)
  responsiveBehavior?: "none" | "scale-proportional";
  // Legacy single strategy (mobile); kept for backwards-compat
  stackStrategy?: "default" | "reverse" | "custom";
  // Per-device stacking strategies
  stackDesktop?: "default" | "reverse" | "custom";
  stackTablet?: "default" | "reverse" | "custom";
  stackMobile?: "default" | "reverse" | "custom";
  // Per-device custom orders on children
  orderDesktop?: number;
  orderTablet?: number;
  orderMobile?: number;
};

export interface LayoutPanelSharedProps {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
  handleResize: (field: string, value: string) => void;
}

export interface EditorContextProps {
  editorFlags?: EditorFlags;
  onUpdateEditor?: (patch: Partial<EditorFlags>) => void;
  editorMap?: HistoryState["editor"];
  updateEditorForId?: (id: string, patch: Partial<EditorFlags>) => void;
}
