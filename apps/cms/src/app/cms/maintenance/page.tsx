import { Card, CardContent, Progress, Button, Tag } from "@/components/atoms/shadcn";
import Link from "next/link";
import { MaintenanceScanner } from "./MaintenanceScanner";
import { scanForMaintenance } from "./scan.server";

export const revalidate = 0;

export default async function MaintenancePage() {
  const flagged = await scanForMaintenance();
  const retireCount = flagged.filter((item) => item.message === "item needs retirement").length;
  const maintenanceCount = flagged.filter((item) => item.message === "item needs maintenance").length;
  const progressValue = flagged.length === 0 ? 100 : Math.max(10, 100 - flagged.length * 20);
  const progressLabel =
    flagged.length === 0
      ? "Maintenance score optimal"
      : `${flagged.length} ${flagged.length === 1 ? "issue" : "issues"} pending`;

  const quickStats = [
    {
      label: "Issues flagged",
      value: flagged.length,
      caption:
        flagged.length === 0
          ? "Everything looks healthy"
          : "Review the flagged items below",
    },
    {
      label: "Needs retirement",
      value: retireCount,
      caption:
        retireCount === 0
          ? "No products require retirement"
          : `${retireCount} items should be retired soon`,
    },
    {
      label: "Needs maintenance",
      value: maintenanceCount,
      caption:
        maintenanceCount === 0
          ? "No maintenance tasks open"
          : `${maintenanceCount} items need attention`,
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-slate-950 text-foreground shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.35),_transparent_55%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Maintenance
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Keep your catalog clean and compliant
              </h1>
              <p className="text-muted-foreground">
                Run automated scans to spot outdated or risky products before customers do. Address flagged items directly from this dashboard.
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={progressValue} label={progressLabel} />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms">Back to CMS home</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-border/40 text-foreground hover:bg-muted/10"
                >
                  <Link href="/cms/live">Check live previews</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-border/15 bg-background/60 text-foreground backdrop-blur"
                >
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="border border-border/20 bg-background/60 text-foreground shadow-2xl backdrop-blur">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Scan status</h2>
                <p className="text-sm text-muted-foreground">
                  Review maintenance insights regularly to avoid shipping stale content or non-compliant products.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Current posture</p>
                  <p className="text-xs text-muted-foreground">
                    {flagged.length === 0
                      ? "All systems go"
                      : `${flagged.length} flagged for investigation`}
                  </p>
                </div>
                <Tag variant={flagged.length === 0 ? "success" : "warning"}>
                  {flagged.length === 0 ? "Healthy" : "Action needed"}
                </Tag>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <MaintenanceScanner initial={flagged} />
    </div>
  );
}
