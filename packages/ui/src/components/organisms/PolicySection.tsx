import * as React from "react";

import { cn } from "../../utils/style";

type PolicySectionTitleTag = "h2" | "h3";

export interface PolicySectionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  titleClassName?: string;
  titleId?: string;
  titleTag?: PolicySectionTitleTag;
}

export function PolicySection({
  title,
  titleClassName,
  titleId,
  titleTag = "h2",
  className,
  children,
  ...props
}: PolicySectionProps) {
  const TitleTag = titleTag;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <TitleTag
        id={titleId}
        className={cn("text-lg font-semibold text-foreground", titleClassName)}
      >
        {title}
      </TitleTag>
      {children}
    </div>
  );
}

