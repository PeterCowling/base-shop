import PopupModal from "./PopupModal";
import type { BlockRegistryEntry } from "./types";
declare const overlayEntries: {
    readonly PopupModal: {
        readonly component: typeof PopupModal;
    };
};
type OverlayRegistry = {
    [K in keyof typeof overlayEntries]: BlockRegistryEntry<any>;
};
export declare const overlayRegistry: OverlayRegistry;
export type OverlayBlockType = keyof typeof overlayEntries;
export {};
//# sourceMappingURL=overlays.d.ts.map