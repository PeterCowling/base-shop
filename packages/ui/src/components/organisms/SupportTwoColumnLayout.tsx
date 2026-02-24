import * as React from "react";

import { cn } from "../../utils/style";

export interface SupportTwoColumnLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  sidebar: React.ReactNode;
  contentClassName?: string;
  sidebarClassName?: string;
}

export function SupportTwoColumnLayout({
  sidebar,
  children,
  className,
  contentClassName,
  sidebarClassName,
  ...props
}: SupportTwoColumnLayoutProps) {
  return (
    <div
      className={cn("grid gap-12 md:grid-cols-[260px_1fr]", className)}
      {...props}
    >
      <div className={cn(sidebarClassName)}>{sidebar}</div>
      <div className={cn("min-w-0 space-y-10", contentClassName)}>{children}</div>
    </div>
  );
}

