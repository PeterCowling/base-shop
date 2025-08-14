import PopupModal from "./PopupModal";
import type { BlockRegistryEntry } from "./types";

export const overlayRegistry = {
  PopupModal: { component: PopupModal },
} as const satisfies Record<string, BlockRegistryEntry<any>>;

export type OverlayBlockType = keyof typeof overlayRegistry;

