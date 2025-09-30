import { Header, type HeaderProps } from "../organisms/Header";
import * as HeaderStories from "../organisms/Header.stories";
import { SideNav, type SideNavProps } from "../organisms/SideNav";
import * as SideNavStories from "../../layout/SideNav.stories";
import { Footer, type FooterProps } from "../organisms/Footer";
import * as FooterStories from "../organisms/Footer.stories";
import { Content, type ContentProps } from "../organisms/Content";
import * as ContentStories from "../organisms/Content.stories";

import type { AppShellProps } from "./AppShell";

/**
 * Builds a complete set of slot props for the {@link AppShell} template using
 * the default stories from the slot components. Reusing story args keeps
 * screen-level stories in sync with the underlying building blocks while
 * avoiding duplicated fixture data.
 */
export function buildAppShellArgs(
  overrides: Partial<AppShellProps> = {}
): AppShellProps {
  const headerProps: HeaderProps = {
    locale: "en" as HeaderProps["locale"],
    nav: [],
    searchSuggestions: [],
    shopName: "Demo Shop",
    ...(HeaderStories.Default.args as HeaderProps | undefined),
  };

  const sideNavProps: SideNavProps = {
    children: "Nav",
    ...(SideNavStories.Default.args as SideNavProps | undefined),
  };

  const footerProps: FooterProps = {
    children: "Footer",
    shopName: "Demo Shop",
    ...(FooterStories.Default.args as FooterProps | undefined),
  };

  const contentProps: ContentProps = {
    children: "Content",
    ...(ContentStories.Default.args as ContentProps | undefined),
  };

  return {
    header: <Header {...headerProps} />,
    sideNav: <SideNav {...sideNavProps} />,
    footer: <Footer {...footerProps} />,
    children: <Content {...contentProps} />,
    ...overrides,
  };
}
