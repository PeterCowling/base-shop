import Canvas from "./Canvas";
import Footer from "./FooterBlock";
import Header from "./HeaderBlock";
import type { BlockRegistryEntry } from "./types";

const defaultPreview = "/window.svg";

const layoutEntries = {
  Header: { component: Header },
  Footer: { component: Footer },
  Canvas: { component: Canvas },
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
