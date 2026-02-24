import * as React from "react";

import { cn } from "../../utils/style";

export interface PolicyPageIntroProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  lastUpdated?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  lastUpdatedClassName?: string;
}

export function PolicyPageIntro({
  title,
  description,
  lastUpdated,
  className,
  titleClassName,
  descriptionClassName,
  lastUpdatedClassName,
  ...props
}: PolicyPageIntroProps) {
  return (
    <div className={className} {...props}>
      <h1 className={cn("text-2xl font-semibold", titleClassName)}>{title}</h1>
      {description ? (
        <p className={cn("mt-2 max-w-3xl text-sm text-muted-foreground", descriptionClassName)}>
          {description}
        </p>
      ) : null}
      {lastUpdated ? (
        <p className={cn("mt-1 text-xs text-muted-foreground", lastUpdatedClassName)}>
          {lastUpdated}
        </p>
      ) : null}
    </div>
  );
}

