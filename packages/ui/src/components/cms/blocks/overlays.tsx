import PopupModal from "./PopupModal";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const overlayEntries = {
  PopupModal: { component: PopupModal },
} as const;

export const overlayRegistry = Object.fromEntries(
  Object.entries(overlayEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as typeof overlayEntries satisfies Record<string, BlockRegistryEntry<any>>;

export type OverlayBlockType = keyof typeof overlayEntries;

