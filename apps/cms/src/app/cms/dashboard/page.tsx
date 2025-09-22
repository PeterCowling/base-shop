import Link from "next/link";
import { listShops } from "../../../lib/listShops";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";

export default async function DashboardIndexPage() {
  const shops = await listShops();
  const quickStats = [
    {
      label: "Total shops",
      value: shops.length,
      caption:
        shops.length === 0
          ? "No storefronts connected"
          : `${shops.length === 1 ? "workspace" : "workspaces"} active`,
    },
    {
      label: "Focus",
      value: shops.length === 0 ? "Setup" : "Manage",
      caption:
        shops.length === 0
          ? "Launch a new shop to enable dashboards"
          : "Select a shop to view dashboards and insights",
    },
  ];
  const progressValue = shops.length === 0 ? 12 : 100;
  const progressLabel =
    shops.length === 0
      ? "Complete onboarding to unlock dashboards"
      : "Dashboards ready";

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-hero-foreground/80">
                Shop dashboards
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Choose a storefront to inspect
              </h1>
              <p className="text-hero-foreground/80">
                Dive into operational analytics for each shop. Pick a workspace to review merchandising, traffic, and conversion trends.
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={progressValue} label={progressLabel} labelClassName="text-hero-foreground/80" />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/configurator">Launch new shop</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                >
                  <Link href="/cms">Return to CMS home</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-primary/15 bg-surface-2 text-foreground"
                >
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold text-primary-foreground">{stat.value}</p>
                    <p className="text-xs text-primary-foreground/70">{stat.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="border border-border/20 bg-surface-2 text-foreground shadow-elevation-5">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Status</h2>
                <p className="text-sm text-foreground">
                  We keep an eye on each storefront’s telemetry so you can hop in when something needs attention.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Workspace health</p>
                  <p className="text-xs text-foreground">
                    {shops.length === 0
                      ? "No dashboards available"
                      : "All dashboards ready"}
                  </p>
                </div>
                <Tag className="shrink-0" variant={shops.length === 0 ? "warning" : "success"}>
                  {shops.length === 0 ? "Action required" : "Ready"}
                </Tag>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border border-border/60">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Available shops</h2>
            <Tag className="shrink-0" variant={shops.length === 0 ? "warning" : "default"}>
              {shops.length === 0 ? "No shops yet" : `${shops.length} available`}
            </Tag>
          </div>
          {shops.length === 0 ? (
            <p className="text-sm text-foreground">
              No shops found. Create a shop in the configurator to unlock dashboards.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {shops.map((shop) => (
                <Card key={shop} className="border border-border/60 bg-surface-3">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{shop}</p>
                      <p className="text-xs text-foreground">
                        View orders, merchandising, and campaign performance for this shop.
                      </p>
                    </div>
                    <Button asChild className="h-10 shrink-0 px-4 text-sm font-medium">
                      <Link href={`/cms/dashboard/${shop}`}>View dashboard</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
