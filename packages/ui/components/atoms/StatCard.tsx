import * as React from "react";
import { cn } from "../../utils/cn";
import { Card, CardContent } from "../ui/card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, className, ...props }, ref) => (
    <Card ref={ref} className={cn(className)} {...props}>
      <CardContent className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  )
);
StatCard.displayName = "StatCard";
