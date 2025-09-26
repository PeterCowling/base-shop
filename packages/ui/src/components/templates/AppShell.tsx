"use client";

import { LayoutProvider, ThemeProvider, useLayout } from "@acme/platform-core";
import * as React from "react";

import { cn } from "../../utils/style";

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
    <div
      data-token="--color-bg"
      className={cn("flex min-h-screen flex-col", className)}
    >
      {header}
      {(showSideNav || hasChildren) ? (
        <div className="flex flex-1">
          {showSideNav && sideNav}
          {hasChildren && <main className="flex-1">{children}</main>}
        </div>
      ) : null}
      {footer}
    </div>
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
