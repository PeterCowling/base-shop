// apps/cms/src/app/cms/shop/[shop]/products/page.tsx

import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import {
  createDraft,
  deleteProduct,
  duplicateProduct,
} from "@cms/actions/products.server";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@acme/lib";
import type { ProductPublication } from "@platform-core/products";
import { readRepo } from "@platform-core/repositories/json.server";
import ProductsTable from "@ui/components/cms/ProductsTable.client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Alert, Progress, Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";
import Link from "next/link";

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  /* ---------------------------------------------------------------------- */
  /*  Data loading                                                          */
  /* ---------------------------------------------------------------------- */
  const { shop } = await params;

  if (!(await checkShopExists(shop))) return notFound();

  const [session, rows] = await Promise.all([
    getServerSession(authOptions),
    readRepo<ProductPublication>(shop),
  ]);

  const isAdmin = session
    ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(
        session.user.role
      )
    : false;

  /* ---------------------------------------------------------------------- */
  /*  Server actions                                                        */
  /* ---------------------------------------------------------------------- */
  async function onCreate() {
    "use server";
    await createDraft(shop);
  }

  async function onDuplicate(shopParam: string, productId: string) {
    "use server";
    await duplicateProduct(shopParam, productId);
  }

  async function onDelete(shopParam: string, productId: string) {
    "use server";
    await deleteProduct(shopParam, productId);
  }

  const totalProducts = rows.length;
  const activeProducts = rows.filter((row) => row.status === "active").length;
  const draftProducts = rows.filter((row) => row.status === "draft").length;
  const archivedProducts = rows.filter((row) => row.status === "archived").length;
  const upcomingProducts = rows.filter((row) => row.status === "scheduled").length;

  const completeness = totalProducts
    ? Math.round((activeProducts / totalProducts) * 100)
    : 0;

  const quickStats = [
    {
      label: "Active",
      value: String(activeProducts),
      caption: "Live on the storefront",
      accent: "bg-surface-3 text-foreground",
    },
    {
      label: "Draft",
      value: String(draftProducts),
      caption: "Still in progress",
      accent: "bg-surface-3 text-foreground",
    },
    {
      label: "Scheduled",
      value: String(upcomingProducts),
      caption: "Queued for launch",
      accent: "bg-surface-3 text-foreground",
    },
    {
      label: "Archived",
      value: String(archivedProducts),
      caption: "Hidden from customers",
      accent: "bg-surface-3 text-foreground",
    },
  ];

  const viewerNotice =
    !isAdmin &&
    "You are signed in as a viewer. Editing actions like create, duplicate, or delete are disabled.";

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-6 px-6 py-7 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-4">
            <div className="space-y-1">
              <Tag variant="default">
                Catalog · {shop}
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Shape every product story for {shop.toUpperCase()}
              </h1>
              <p className="text-sm text-hero-foreground/80">
                Track launch readiness, make quick edits, and plan upcoming releases from this workspace.
              </p>
            </div>
            <div className="space-y-4">
              <Progress
                value={completeness}
                label={`${activeProducts}/${totalProducts || 0} products live`}
                labelClassName="text-hero-foreground/80"
              />
              <div className="flex flex-wrap items-center gap-3">
                {isAdmin ? (
                  <form action={onCreate}>
                    <Button
                      type="submit"
                      className="h-11 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
                    >
                      Add new product
                    </Button>
                  </form>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-border/40 px-5 text-sm font-semibold text-foreground hover:bg-surface-3"
                >
                  <Link href={`/cms/shop/${shop}/pages/new/page`}>
                    Build merchandising page
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-border/40 px-5 text-sm font-semibold text-foreground hover:bg-surface-3"
                >
                  <Link href={`/cms/shop/${shop}/pages/new/componenteditor`}>
                    Open component editor
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl border border-border/10 px-4 py-3 backdrop-blur",
                    stat.accent
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.caption}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-border/10 bg-surface-2 text-foreground shadow-elevation-4">
          <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Launch checklist</h2>
                <p className="text-sm text-muted-foreground">
                  Keep your catalog healthy before the next campaign.
                </p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Review draft listings for missing media or pricing.</p>
                <p>• Schedule upcoming releases to build anticipation.</p>
                <p>• Archive aging inventory to keep the storefront focused.</p>
              </div>
              <Button asChild variant="outline" className="h-10 w-full">
                <Link href={`/cms/shop/${shop}/pages/edit/page`}>Preview catalog experience</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <Card className="border border-border/10 bg-surface-2 text-foreground shadow-elevation-3">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Catalog overview</h2>
                <p className="text-sm text-muted-foreground">
                  Filter, duplicate, or retire products without leaving this view.
                </p>
              </div>
              <Tag className="shrink-0" variant="default">
                {totalProducts} total products
              </Tag>
            </div>
            <ProductsTable
              shop={shop}
              rows={rows}
              isAdmin={isAdmin}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          </CardContent>
        </Card>

        {viewerNotice && (
          <Alert variant="warning" tone="soft" title={viewerNotice} />
        )}
      </section>
    </div>
  );
}
