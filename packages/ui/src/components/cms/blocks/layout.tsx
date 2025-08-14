import Header from "./HeaderBlock";
import Footer from "./FooterBlock";
import type { BlockRegistryEntry } from "./types";

export const layoutRegistry = {
  Header: { component: Header },
  Footer: { component: Footer },
} as const satisfies Record<string, BlockRegistryEntry<any>>;

export type LayoutBlockType = keyof typeof layoutRegistry;
