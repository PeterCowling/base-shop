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
  onAdd: (type: ComponentType, initializer?: Partial<PageComponent>) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection?: boolean;
  defaultTab?: "components" | "media";
}

export type PaletteTab = "components" | "media";

