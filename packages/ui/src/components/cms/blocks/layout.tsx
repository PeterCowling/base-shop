import Header from "./HeaderBlock";
import Footer from "./FooterBlock";

export const layoutRegistry = {
  Header: { component: Header },
  Footer: { component: Footer },
} as const;

export type LayoutBlockType = keyof typeof layoutRegistry;
