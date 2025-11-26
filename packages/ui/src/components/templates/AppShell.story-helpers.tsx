import { Header, type HeaderProps } from "../organisms/Header";
import { SideNav, type SideNavProps } from "../organisms/SideNav";
import { Footer, type FooterProps } from "../organisms/Footer";
import { Content, type ContentProps } from "../organisms/Content";

import type { AppShellProps } from "./AppShell";

/**
 * Builds a complete set of slot props for the {@link AppShell} template using
 * the same defaults defined in the individual component stories. Keeping these
 * fixtures together prevents the screen-level stories from drifting.
 */
export function buildAppShellArgs(
  overrides: Partial<AppShellProps> = {}
): AppShellProps {
  const headerProps: HeaderProps = {
    locale: "en" as HeaderProps["locale"],
    nav: [],
    searchSuggestions: [],
    shopName: "Demo Shop",
  };

  const sideNavProps: SideNavProps = {
    children: "Nav",
  };

  const footerProps: FooterProps = {
    children: "Footer",
    shopName: "Demo Shop",
  };

  const contentProps: ContentProps = {
    children: "Content",
  };

  return {
    header: <Header {...headerProps} />,
    sideNav: <SideNav {...sideNavProps} />,
    footer: <Footer {...footerProps} />,
    children: <Content {...contentProps} />,
    ...overrides,
  };
}
