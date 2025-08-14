import Header from "./HeaderBlock";
import Footer from "./FooterBlock";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const layoutEntries = {
  Header: { component: Header },
  Footer: { component: Footer },
} as const;

export const layoutRegistry = Object.fromEntries(
  Object.entries(layoutEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as typeof layoutEntries satisfies Record<string, BlockRegistryEntry<any>>;

export type LayoutBlockType = keyof typeof layoutEntries;
