import fsSync from "fs";
import fs from "fs/promises";
import path from "path";
import { listShops } from "../../../lib/listShops";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";
import { LivePreviewList } from "./LivePreviewList";
import Link from "next/link";

export const metadata = {
  title: "Live shops · Base-Shop",
};

function resolveAppsRoot(): string {
  let dir = process.cwd();
  while (true) {
    const appsPath = path.join(dir, "apps");
    if (fsSync.existsSync(appsPath)) return appsPath;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return path.resolve(process.cwd(), "apps");
}

export type PortInfo = {
  port: number | null;
  error?: string;
};

async function findPort(shop: string): Promise<PortInfo> {
  const root = resolveAppsRoot();
  const appDir = path.join(root, `shop-${shop}`);
  const pkgPath = path.join(appDir, "package.json");

  if (!fsSync.existsSync(appDir)) {
    return { port: null, error: "app not found" };
  }
  if (!fsSync.existsSync(pkgPath)) {
    return { port: null, error: "package.json not found" };
  }

  try {
    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
    const cmd = pkg.scripts?.dev ?? pkg.scripts?.start ?? "";
    const match = cmd.match(/-p\s*(\d+)/);
    return { port: match ? parseInt(match[1], 10) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { port: null, error: message };
  }
}

export default async function LivePage() {
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
    ? `${previewsReady}/${shops.length} previews configured`
    : "No shops configured";

  const quickStats = [
    {
      label: "Total shops",
      value: shops.length,
      caption:
        shops.length === 0
          ? "Connect a shop to enable previews"
          : `${shops.length === 1 ? "workspace" : "workspaces"} available`,
    },
    {
      label: "Previews ready",
      value: previewsReady,
      caption:
        previewsReady === 0
          ? "Run the dev server in each shop app"
          : "Open previews launch instantly",
    },
    {
      label: "Needs attention",
      value: previewsUnavailable,
      caption:
        previewsUnavailable === 0
          ? "Everything is wired up"
          : "Start the missing dev servers to enable previews",
    },
  ];

  const items = shops.map((shop) => {
    const info = portInfo[shop];
    const url = info?.port ? `http://localhost:${info.port}` : null;
    return { shop, url, error: info?.error };
  });

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.35),_transparent_55%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Live previews
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Validate storefronts in real time
              </h1>
              <p className="text-white/80">
                Launch each storefront's development server directly from the CMS. Monitor availability before sharing links with stakeholders.
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={progressValue} label={progressLabel} />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/dashboard">View dashboards</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-white/40 text-white hover:bg-white/10"
                >
                  <Link href="/cms/maintenance">Run maintenance scan</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-white/15 bg-white/5 text-white backdrop-blur"
                >
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="border border-white/20 bg-white/5 text-white shadow-2xl backdrop-blur">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Preview readiness</h2>
                <p className="text-sm text-white/70">
                  Keep development servers running so designers and QA can review changes instantly.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Available previews</p>
                  <p className="text-xs text-white/70">
                    {previewsReady === shops.length
                      ? "All previews online"
                      : `${previewsReady} of ${shops.length} available`}
                  </p>
                </div>
                <Tag variant={previewsUnavailable === 0 ? "success" : "warning"}>
                  {previewsUnavailable === 0 ? "All good" : "Needs attention"}
                </Tag>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border border-border/60">
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Shop previews</h2>
            <Tag variant={previewsUnavailable === 0 ? "success" : "warning"}>
              {shops.length === 0
                ? "No shops"
                : previewsUnavailable === 0
                ? "All ready"
                : `${previewsUnavailable} need setup`}
            </Tag>
          </div>
          {shops.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shops found. Create a shop in the configurator to unlock live previews.
            </p>
          ) : (
            <LivePreviewList items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
