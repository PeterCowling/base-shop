import * as React from "react";

import { cn } from "../../utils/style";
import { Stack } from "../atoms/primitives/Stack";

export interface ResourceCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  bodyClassName?: string;
}

export function ResourceCard({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  bodyClassName,
  children,
  ...props
}: ResourceCardProps) {
  return (
    <div className={cn("rounded-lg border p-5", className)} {...props}>
      <Stack gap={3} className={bodyClassName}>
        <div className={cn("text-sm font-semibold", titleClassName)}>{title}</div>
        {description ? (
          <div className={cn("text-sm text-muted-foreground", descriptionClassName)}>
            {description}
          </div>
        ) : null}
        {children}
      </Stack>
    </div>
  );
}
