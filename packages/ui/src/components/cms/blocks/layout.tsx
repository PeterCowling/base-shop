import Header from "./HeaderBlock";
import Footer from "./FooterBlock";

export const layoutRegistry = {
  Header,
  Footer,
} as const;

export type LayoutBlockType = keyof typeof layoutRegistry;
