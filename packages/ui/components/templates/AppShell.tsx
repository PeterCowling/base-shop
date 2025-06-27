import * as React from "react";
import { cn } from "../../utils/cn";

export interface AppShellProps {
  header?: React.ReactNode;
  sideNav?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({
  header,
  sideNav,
  footer,
  children,
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      {header}
      <div className="flex flex-1">
        {sideNav}
        <main className="flex-1">{children}</main>
      </div>
      {footer}
    </div>
  );
}
