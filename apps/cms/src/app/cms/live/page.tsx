import type { Metadata } from "next";
import Link from "next/link";
import fsSync from "fs";
import fs from "fs/promises";
import path from "path";

import { Grid } from "@acme/design-system/primitives";
import en from "@acme/i18n/en.json";
import { TranslationsProvider } from "@acme/i18n/Translations";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";

import { listShops } from "../../../lib/listShops";

import { LivePreviewList } from "./LivePreviewList";

// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const HERO_LABEL_CLASS = "text-hero-foreground/80";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("en");
  return { title: t("cms.live.title", { brand: t("brand.name") }) as string };
}

function resolveAppsRoot(): string {
  let dir = process.cwd();
  while (true) {
    const appsPath = path.join(dir, "apps");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 runtime-resolved monorepo path
    if (fsSync.existsSync(appsPath)) return appsPath;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return path.resolve(process.cwd(), "apps");
}

export type PortInfo = {
  port: number | null;
  // Non-UI error code; mapped to user copy later
  errorCode?: "app_not_found" | "package_json_missing" | "read_error";
  errorDetail?: string;
};

async function findPort(shop: string): Promise<PortInfo> {
  const root = resolveAppsRoot();
  const appDir = path.join(root, `shop-${shop}`);
  const pkgPath = path.join(appDir, "package.json");

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 workspace app may not exist
  if (!fsSync.existsSync(appDir)) {
    return { port: null, errorCode: "app_not_found" };
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 reading package manifest dynamically
  if (!fsSync.existsSync(pkgPath)) {
    return { port: null, errorCode: "package_json_missing" };
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 read workspace package manifest
    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
    const cmd = pkg.scripts?.dev ?? pkg.scripts?.start ?? "";
    const match = cmd.match(/-p\s*(\d+)/);
    return { port: match ? parseInt(match[1], 10) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { port: null, errorCode: "read_error", errorDetail: message };
  }
}

export default async function LivePage() {
  const t = await getTranslations("en");
  const shops = await listShops();

  const portInfo: Record<string, PortInfo> = Object.fromEntries(
    await Promise.all(
      shops.map(async (shop) => {
        const info = await findPort(shop);
        return [shop, info] as const;
      })
    )
  );

  const previewsReady = shops.filter((shop) => Boolean(portInfo[shop]?.port)).length;
  const previewsUnavailable = shops.filter((shop) => !portInfo[shop]?.port).length;

  const progressValue = shops.length
    ? Math.round((previewsReady / shops.length) * 100)
    : 0;
  const progressLabel = shops.length
    ? (t("cms.live.progress.label", {
        ready: previewsReady,
        total: shops.length,
      }) as string)
    : (t("cms.live.progress.empty") as string);

  const quickStats = [
    {
      label: t("cms.live.stats.totalShops.label"),
      value: shops.length,
      caption:
        shops.length === 0
          ? (t("cms.live.stats.totalShops.empty") as string)
          : (t(
              shops.length === 1
                ? "cms.live.stats.totalShops.available.singular"
                : "cms.live.stats.totalShops.available.plural"
            ) as string),
    },
    {
      label: t("cms.live.stats.previewsReady.label"),
      value: previewsReady,
      caption:
        previewsReady === 0
          ? (t("cms.live.stats.previewsReady.empty") as string)
          : (t("cms.live.stats.previewsReady.caption") as string),
    },
    {
      label: t("cms.live.stats.needsAttention.label"),
      value: previewsUnavailable,
      caption:
        previewsUnavailable === 0
          ? (t("cms.live.stats.needsAttention.allGood") as string)
          : (t("cms.live.stats.needsAttention.help") as string),
    },
  ];

  const items = shops.map((shop) => {
    const info = portInfo[shop];
    const url = info?.port ? `http://localhost:${info.port}` : null;
    const error =
      !url && info?.errorCode
        ? (t(`cms.live.error.${info.errorCode}`) as string)
        : undefined;
    return { shop, url, error };
  });

  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-8 p-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-hero-foreground/80">
                {t("cms.live.hero.tag")}
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                {t("cms.live.hero.heading")}
              </h1>
              <p className="text-hero-foreground/80">
                {t("cms.live.hero.desc")}
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={progressValue} label={progressLabel} labelClassName={HERO_LABEL_CLASS} />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/dashboard">{t("cms.live.hero.cta.viewDashboards")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                >
                  <Link href="/cms/maintenance">{t("cms.live.hero.cta.runMaintenance")}</Link>
                </Button>
              </div>
            </div>
            {/* Use DS Grid primitive to avoid leaf flex layout */}
            <Grid cols={1} gap={3} className="sm:grid-cols-2">
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-primary/15 bg-surface-2 text-foreground sm:flex-1"
                >
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-foreground">{stat.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </div>
          <Card className="border border-primary/20 bg-surface-2 text-foreground shadow-elevation-5 lg:col-span-1">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("cms.live.readiness.title")}</h2>
                <p className="text-sm text-foreground">
                  {t("cms.live.readiness.desc")}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t("cms.live.readiness.available.label")}</p>
                  <p className="text-xs text-foreground">
                    {previewsReady === shops.length
                      ? (t("cms.live.readiness.available.all") as string)
                      : (t("cms.live.readiness.available.count", {
                          ready: previewsReady,
                          total: shops.length,
                        }) as string)}
                  </p>
                </div>
                <Tag className="shrink-0" variant={previewsUnavailable === 0 ? "success" : "warning"}>
                  {previewsUnavailable === 0
                    ? (t("cms.live.tag.allGood") as string)
                    : (t("cms.live.tag.needsAttention") as string)}
                </Tag>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border border-border/60">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{t("cms.live.list.title")}</h2>
            <Tag className="shrink-0" variant={previewsUnavailable === 0 ? "success" : "warning"}>
              {shops.length === 0
                ? (t("cms.live.list.noShops") as string)
                : previewsUnavailable === 0
                ? (t("cms.live.list.allReady") as string)
                : (t("cms.live.list.needsSetup", { count: previewsUnavailable }) as string)}
            </Tag>
          </div>
          {shops.length === 0 ? (
            <p className="text-sm text-foreground">
              {t("cms.live.list.emptyDesc")}
            </p>
          ) : (
            <LivePreviewList items={items} />
          )}
        </CardContent>
      </Card>
      </div>
    </TranslationsProvider>
  );
}
