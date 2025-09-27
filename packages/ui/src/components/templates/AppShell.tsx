"use client";

import { LayoutProvider, ThemeProvider, useLayout } from "@acme/platform-core";
import * as React from "react";

import { cn } from "../../utils/style";
import { Stack } from "../atoms/primitives/Stack";
import { Sidebar } from "../atoms/primitives/Sidebar";

export interface AppShellProps {
  header?: React.ReactNode;
  sideNav?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function ShellLayout({
  header,
  sideNav,
  footer,
  children,
  className,
}: AppShellProps) {
  const { isMobileNavOpen } = useLayout();
  const hasChildren = React.Children.count(children) > 0;
  const showSideNav = Boolean(isMobileNavOpen && sideNav);

  return (
    <Stack
      data-token="--color-bg" // i18n-exempt: token identifier, not user copy
      className={cn("min-h-screen", className)} // i18n-exempt: className utilities
      gap={0}
    >
      {header}
      {showSideNav || hasChildren ? (
        <Sidebar className="flex-1">
          {showSideNav ? sideNav : null}
          {hasChildren ? <main className="flex-1">{children}</main> : null}
        </Sidebar>
      ) : null}
      {footer}
    </Stack>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <ThemeProvider>
      <LayoutProvider>
        <ShellLayout {...props} />
      </LayoutProvider>
    </ThemeProvider>
  );
}
