import Section from "./Section";
import MultiColumn from "./containers/MultiColumn";

export const containerRegistry = {
  Section,
  MultiColumn,
} as const;

export type ContainerBlockType = keyof typeof containerRegistry;
