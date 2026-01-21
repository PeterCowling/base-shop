import PopupModal from "./PopupModal";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const overlayEntries = {
  PopupModal: { component: PopupModal },
} as const;

type OverlayRegistry = {
  [K in keyof typeof overlayEntries]: BlockRegistryEntry<unknown>;
};

export const overlayRegistry = Object.fromEntries(
  Object.entries(overlayEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as OverlayRegistry;

export type OverlayBlockType = keyof typeof overlayEntries;

