import type { ComponentType } from "./defaults";
import type { PageComponent } from "@acme/types";

export interface PaletteMeta {
  type: ComponentType;
  label: string;
  icon: string;
  description?: string;
  previewImage: string;
}

export interface PaletteItemProps extends PaletteMeta {
  onAdd: (type: ComponentType, label: string) => void;
}

export interface PaletteProps {
  onAdd: (type: ComponentType) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection?: boolean;
  defaultTab?: "components" | "media";
  onInsertPreset?: (component: PageComponent) => void;
  /**
   * Optional filter mode to split the palette into basic elements vs sections.
   * - elements: atoms, molecules, overlays
   * - sections: containers, organisms, and any app-provided categories
   * - all (default): show everything
   */
  mode?: "elements" | "sections" | "all";
  /** Optional allowlist for limiting palette to specific block types. */
  allowedTypes?: Set<ComponentType>;
}

export type PaletteTab = "components" | "media";
