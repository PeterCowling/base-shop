import Section from "./Section";
import MultiColumn from "./containers/MultiColumn";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const containerEntries = {
  Section: { component: Section },
  MultiColumn: { component: MultiColumn },
} as const;

type ContainerRegistry = {
  [K in keyof typeof containerEntries]: BlockRegistryEntry<any>;
};

export const containerRegistry = Object.fromEntries(
  Object.entries(containerEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as ContainerRegistry;

export type ContainerBlockType = keyof typeof containerEntries;
