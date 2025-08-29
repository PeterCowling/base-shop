import Section from "./Section";
import MultiColumn from "./containers/MultiColumn";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const containerEntries = {
  Section: { component: Section },
  MultiColumn: { component: MultiColumn },
} as const;

type ContainerRegistry = {
  -readonly [K in keyof typeof containerEntries]: BlockRegistryEntry<unknown>;
};

export const containerRegistry: ContainerRegistry = Object.entries(
  containerEntries,
).reduce(
  (acc, [k, v]) => {
    acc[k as keyof typeof containerEntries] = {
      previewImage: defaultPreview,
      ...v,
    };
    return acc;
  },
  {} as ContainerRegistry,
);

export type ContainerBlockType = keyof typeof containerEntries;
