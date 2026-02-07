import Bind from "./containers/Bind";
import CarouselContainer from "./containers/CarouselContainer";
import Dataset from "./containers/Dataset";
import GridContainer from "./containers/GridContainer";
import MultiColumn from "./containers/MultiColumn";
import Repeater from "./containers/Repeater";
import StackFlex from "./containers/StackFlex";
import TabsAccordionContainer from "./containers/TabsAccordionContainer";
import Section from "./Section";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const containerEntries = {
  Section: { component: Section },
  MultiColumn: { component: MultiColumn },
  StackFlex: { component: StackFlex },
  Grid: { component: GridContainer },
  CarouselContainer: { component: CarouselContainer },
  TabsAccordionContainer: { component: TabsAccordionContainer },
  Dataset: { component: Dataset },
  Repeater: { component: Repeater },
  Bind: { component: Bind },
} as const;

type ContainerRegistry = {
  -readonly [K in keyof typeof containerEntries]: BlockRegistryEntry<Record<string, unknown>>;
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
