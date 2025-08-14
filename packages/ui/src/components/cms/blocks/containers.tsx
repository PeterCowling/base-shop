import Section from "./Section";
import MultiColumn from "./containers/MultiColumn";
import type { BlockRegistryEntry } from "./types";

export const containerRegistry = {
  Section: { component: Section },
  MultiColumn: { component: MultiColumn },
} as const satisfies Record<string, BlockRegistryEntry<any>>;

export type ContainerBlockType = keyof typeof containerRegistry;
