import Header from "./HeaderBlock";
import Footer from "./FooterBlock";
import type { BlockRegistryEntry } from "./types";
declare const layoutEntries: {
    readonly Header: {
        readonly component: typeof Header;
    };
    readonly Footer: {
        readonly component: typeof Footer;
    };
};
type LayoutRegistry = {
    [K in keyof typeof layoutEntries]: BlockRegistryEntry<any>;
};
export declare const layoutRegistry: LayoutRegistry;
export type LayoutBlockType = keyof typeof layoutEntries;
export {};
//# sourceMappingURL=layout.d.ts.map