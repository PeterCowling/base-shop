import * as React from "react";

import { cn } from "../../utils/style";

export interface LegalEntityCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  titleClassName?: string;
  bodyClassName?: string;
}

export function LegalEntityCard({
  title,
  className,
  titleClassName,
  bodyClassName,
  children,
  ...props
}: LegalEntityCardProps) {
  return (
    <div
      className={cn("rounded-lg border border-border-2 bg-surface-2/50 p-4 text-sm", className)}
      {...props}
    >
      {title ? (
        <div className={cn("text-base font-semibold text-foreground", titleClassName)}>
          {title}
        </div>
      ) : null}
      <div className={cn(title ? "mt-2" : undefined, bodyClassName)}>{children}</div>
    </div>
  );
}

