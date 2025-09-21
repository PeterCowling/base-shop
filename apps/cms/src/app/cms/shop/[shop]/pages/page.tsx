// apps/cms/src/app/cms/shop/[shop]/pages/page.tsx

import { canWrite } from "@auth";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@acme/lib";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PagesClient from "./PagesClient";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function PagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const [session, initial] = await Promise.all([
    getServerSession(authOptions),
    getPages(shop),
  ]);
  const writable = canWrite(session?.user.role);
  const resolveStatus = (page: Page) => {
    const raw = (page as unknown as { status?: unknown }).status;
    return typeof raw === "string" ? raw : "";
  };
  const totalPages = initial.length;
  const publishedPages = initial.filter((page) => resolveStatus(page) === "published").length;
  const draftPages = initial.filter((page) => resolveStatus(page) === "draft").length;
  const archivedPages = initial.filter((page) => resolveStatus(page) === "archived").length;

  const quickStats = [
    {
      label: "Published",
      value: String(publishedPages),
      caption: "Live on storefront",
      accent: "bg-success/20 text-foreground",
    },
    {
      label: "Draft",
      value: String(draftPages),
      caption: "Still in progress",
      accent: "bg-warning/20 text-foreground",
    },
    {
      label: "Archived",
      value: String(archivedPages),
      caption: "Hidden from navigation",
      accent: "bg-muted/20 text-foreground",
    },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero text-primary-foreground shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.2),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">
            Pages · {shop}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Curate every page that shapes your storefront narrative
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage hero stories, campaign landing pages, and evergreen content from one creative workspace.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
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
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-lg">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-foreground">
              <div>
                <h2 className="text-lg font-semibold">Page library</h2>
                <p className="text-sm text-muted-foreground">
                  Launch campaign landing pages, update evergreen content, or archive what no longer fits.
                </p>
              </div>
              <Tag variant="default">
                {totalPages} total pages
              </Tag>
            </div>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading pages…</p>}>
              <PagesClient shop={shop} initial={initial} canWrite={writable} />
            </Suspense>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
