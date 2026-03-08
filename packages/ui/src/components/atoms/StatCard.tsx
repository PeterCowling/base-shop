import * as React from "react";

import { cn } from "../../utils/style";

import { Card, CardContent } from "./primitives/card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
}

export function StatCard({ label, value, className, ref, ...props }: StatCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <Card data-slot="stat-card" ref={ref} className={cn(className)} {...props}>
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}
