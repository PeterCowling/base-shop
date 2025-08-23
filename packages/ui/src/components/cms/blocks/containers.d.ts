import Section from "./Section";
import MultiColumn from "./containers/MultiColumn";
import type { BlockRegistryEntry } from "./types";
declare const containerEntries: {
    readonly Section: {
        readonly component: typeof Section;
    };
    readonly MultiColumn: {
        readonly component: typeof MultiColumn;
    };
};
type ContainerRegistry = {
    -readonly [K in keyof typeof containerEntries]: BlockRegistryEntry<any>;
};
export declare const containerRegistry: ContainerRegistry;
export type ContainerBlockType = keyof typeof containerEntries;
export {};
//# sourceMappingURL=containers.d.ts.map