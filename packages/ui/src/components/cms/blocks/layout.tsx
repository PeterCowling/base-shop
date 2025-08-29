import Header from "./HeaderBlock";
import Footer from "./FooterBlock";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const layoutEntries = {
  Header: { component: Header },
  Footer: { component: Footer },
} as const;

type LayoutRegistry = {
  [K in keyof typeof layoutEntries]: BlockRegistryEntry<unknown>;
};

export const layoutRegistry = Object.fromEntries(
  Object.entries(layoutEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
  ]),
) as LayoutRegistry;

export type LayoutBlockType = keyof typeof layoutEntries;
