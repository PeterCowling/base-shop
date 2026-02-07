import * as React from "react";

import { Card, CardContent } from "../primitives/card";
import { cn } from "../utils/style";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
}

export const StatCard = (
  {
    ref,
    label,
    value,
    className,
    ...props
  }: StatCardProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<Card ref={ref} className={cn(className)} {...props}>
  <CardContent className="flex flex-col gap-1">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="text-2xl font-semibold">{value}</span>
  </CardContent>
</Card>);
