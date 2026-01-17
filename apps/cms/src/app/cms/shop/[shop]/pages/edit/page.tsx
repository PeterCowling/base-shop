// apps/cms/src/app/cms/shop/[shop]/pages/edit/page.tsx

import { canWrite } from "@acme/auth";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@acme/lib";
import { getPages } from "@acme/platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PagesClient from "../PagesClient";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@acme/ui/components/atoms";
import { cn } from "@acme/ui/utils/style";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";
import { useTranslations as serverUseTranslations } from "@acme/i18n/useTranslations.server";

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function PagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const t = await serverUseTranslations("en");
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
      label: t("cms.pages.status.published"),
      value: String(publishedPages),
      caption: t("cms.pages.status.published.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- DS-1023: class names [ttl=2026-12-31]
    },
    {
      label: t("cms.pages.status.draft"),
      value: String(draftPages),
      caption: t("cms.pages.status.draft.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- DS-1023: class names [ttl=2026-12-31]
    },
    {
      label: t("cms.pages.status.archived"),
      value: String(archivedPages),
      caption: t("cms.pages.status.archived.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- DS-1023: class names [ttl=2026-12-31]
    },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">{t("cms.breadcrumb.pages")} · {shop}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {t("cms.pages.edit.heading")}
          </h1>
          <p className="text-sm text-hero-foreground/80">
            {t("cms.pages.edit.subheading")}
          </p>
          <DSGrid cols={1} gap={3} className="sm:grid-cols-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-border/10 px-4 py-3 backdrop-blur", // i18n-exempt -- DS-1023: class names [ttl=2026-12-31]
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
          </DSGrid>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-foreground">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{t("cms.pages.library.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("cms.pages.library.description")}
                </p>
              </div>
              <Tag className="shrink-0" variant="default">
                {t("cms.pages.library.total", { count: totalPages })}
              </Tag>
            </div>
            <Suspense fallback={<p className="text-sm text-muted-foreground">{t("cms.pages.library.loading")}</p>}>
              <PagesClient shop={shop} initial={initial} canWrite={writable} />
            </Suspense>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
