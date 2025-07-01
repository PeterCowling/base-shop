import * as React from "react";
import { cn } from "../../utils/cn";
import { Avatar } from "../atoms/Avatar";
import type { Column } from "../organisms/DataTable";
import { DataTable } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import { StatsGrid } from "../organisms/StatsGrid";

export interface AccountDashboardTemplateProps<T>
  extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  stats?: StatItem[];
  orders?: T[];
  orderColumns?: Column<T>[];
}

export function AccountDashboardTemplate<T>({
  user,
  stats = [],
  orders = [],
  orderColumns = [],
  className,
  ...props
}: AccountDashboardTemplateProps<T>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar} alt={user.name} size={40} />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>
      {stats.length > 0 && <StatsGrid items={stats} />}
      {orders.length > 0 && orderColumns.length > 0 && (
        <DataTable rows={orders} columns={orderColumns} />
      )}
    </div>
  );
}
