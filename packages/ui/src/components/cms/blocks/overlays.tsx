import PopupModal from "./PopupModal";

export const overlayRegistry = {
  PopupModal: { component: PopupModal },
} as const;

export type OverlayBlockType = keyof typeof overlayRegistry;

