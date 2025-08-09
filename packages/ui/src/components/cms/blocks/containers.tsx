import Section from "./Section";

export const containerRegistry = {
  Section,
} as const;

export type ContainerBlockType = keyof typeof containerRegistry;
