import { notFound, redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import { checkShopExists } from "@acme/platform-core";
import { listProductImports } from "@acme/platform-core/repositories/productImport.server";
import type { ProductImportEvent } from "@acme/platform-core/types/productImport";
import { Tag } from "@acme/ui/components/atoms";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";

import { Card, CardContent } from "@/components/atoms/shadcn";

import ProductImportClient from "./productImport.client";

export const revalidate = 0;

function getRole(session: Session | null): Role | null {
  const role = session?.user?.role;
  if (typeof role !== "string") return null;
  return role as Role;
}

export default async function ProductImportPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_catalog")) {
    redirect(
      `/403?shop=${encodeURIComponent(shop)}&reason=${encodeURIComponent(
        "manage_catalog"
      )}`
    );
  }

  let recent: ProductImportEvent[] = [];
  try {
    recent = await listProductImports(shop, { limit: 10 });
  } catch {
    recent = [];
  }

  const lastImportedAt = recent[0]?.importedAt
    ? new Date(recent[0].importedAt).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const statCards = [
    { label: "Recent imports", value: String(recent.length) },
    { label: "Last import", value: lastImportedAt },
    { label: "Idempotency", value: "Enforced" },
    { label: "Preview", value: "Supported" },
  ] as const;

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">Product import · {shop}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">Import products</h1>
          <p className="text-sm text-hero-foreground/80">
            Bulk upsert catalogue records with preview, validation, and an import audit log.
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
            <ProductImportClient shop={shop} recent={recent} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
