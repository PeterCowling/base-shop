import { notFound, redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import { checkShopExists } from "@acme/platform-core";
import { listStockAdjustments } from "@acme/platform-core/repositories/stockAdjustments.server";
import type { StockAdjustmentEvent } from "@acme/platform-core/types/stockAdjustments";
import { Tag } from "@acme/ui/components/atoms";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";

import { Card, CardContent } from "@/components/atoms/shadcn";

import StockAdjustmentsClient from "./stockAdjustments.client";

export const revalidate = 0;

function getRole(session: Session | null): Role | null {
  const role = session?.user?.role;
  if (typeof role !== "string") return null;
  return role as Role;
}

export default async function StockAdjustmentsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_inventory")) {
    redirect(
      `/403?shop=${encodeURIComponent(shop)}&reason=${encodeURIComponent(
        "manage_inventory"
      )}`
    );
  }

  let recent: StockAdjustmentEvent[] = [];
  try {
    recent = await listStockAdjustments(shop, { limit: 10 });
  } catch {
    recent = [];
  }

  const lastAdjustedAt = recent[0]?.adjustedAt
    ? new Date(recent[0].adjustedAt).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const statCards = [
    { label: "Recent adjustments", value: String(recent.length) },
    { label: "Last adjusted", value: lastAdjustedAt },
    { label: "Audit log", value: "Immutable" },
    { label: "Reasons", value: "Required" },
  ] as const;

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-warning/20 to-transparent" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">Stock adjustments · {shop}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">Adjust stock</h1>
          <p className="text-sm text-hero-foreground/80">
            Increase or decrease stock with required reasons. Preview first, then commit with idempotency and audit trail.
          </p>
          <DSGrid cols={1} gap={3} className="sm:grid-cols-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/10 bg-surface-2 px-4 py-3 text-xs text-muted-foreground"
              >
                <p className="font-semibold uppercase tracking-wide">{stat.label}</p>
                <p className="mt-1 text-sm text-foreground">{stat.value}</p>
              </div>
            ))}
          </DSGrid>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <StockAdjustmentsClient shop={shop} recent={recent} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
