// packages/ui/components/templates/AccountDashboardTemplate.tsx

import * as React from "react";

import { cn } from "../../utils/style";
import { Avatar } from "../atoms/Avatar";
import type { Column } from "../organisms/DataTable";
import { DataTable } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import { StatsGrid } from "../organisms/StatsGrid";

export interface AccountDashboardTemplateProps<T>
  extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    /** Full name shown beside the avatar */
    name: string;
    /** Primary e-mail address */
    email: string;
    /** Optional absolute/relative URL for the avatar image */
    avatar?: string;
  };
  /** KPI cards displayed below the user header */
  stats?: StatItem[];
  /** Order rows rendered in the table */
  orders?: T[];
  /** Column metadata for the order table */
  orderColumns?: Column<T>[];
}

/**
 * Generic dashboard layout for an authenticated shopper.
 * Supply `<T>` as the row type for orders (e.g. `OrderRow`).
 */
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
      {/* ─────────────────── User header ─────────────────── */}
      <div className="flex items-center gap-4">
        <Avatar
          /* Next <Image> forbids undefined → fall back to “empty string” */
          src={user.avatar ?? ""}
          alt={user.name}
          size={40}
        />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      {/* ─────────────────── Stats grid ──────────────────── */}
      {stats.length > 0 && <StatsGrid items={stats} />}

      {/* ─────────────────── Orders table ─────────────────── */}
      {orders.length > 0 && orderColumns.length > 0 && (
        <DataTable rows={orders} columns={orderColumns} />
      )}
    </div>
  );
}
