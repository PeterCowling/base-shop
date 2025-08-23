import type { PageComponent } from "@acme/types";
import { atomRegistry, moleculeRegistry, organismRegistry, containerRegistry, layoutRegistry } from "../blocks";
export type ComponentType = keyof typeof atomRegistry | keyof typeof moleculeRegistry | keyof typeof organismRegistry | keyof typeof containerRegistry | keyof typeof layoutRegistry;
export declare const CONTAINER_TYPES: ComponentType[];
export declare const defaults: Partial<Record<ComponentType, Partial<PageComponent>>>;
export default defaults;
//# sourceMappingURL=defaults.d.ts.map