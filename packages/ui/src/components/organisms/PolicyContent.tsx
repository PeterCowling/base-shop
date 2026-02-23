import * as React from "react";

import { cn } from "../../utils/style";

export type PolicyContentProps = React.HTMLAttributes<HTMLDivElement>;

export function PolicyContent({ className, ...props }: PolicyContentProps) {
  return <div className={cn("space-y-8 text-sm text-muted-foreground", className)} {...props} />;
}

