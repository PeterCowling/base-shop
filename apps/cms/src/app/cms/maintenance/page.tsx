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
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero text-primary-foreground shadow-xl">
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-foreground/70">
                Maintenance
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Keep your catalog clean and compliant
              </h1>
              <p className="text-primary-foreground/80">
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
                  className="h-11 px-5 text-sm font-semibold border-primary/40 text-primary-foreground hover:bg-primary/10"
                >
                  <Link href="/cms/live">Check live previews</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
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
          <Card className="border border-border/20 bg-surface-2 text-foreground shadow-2xl">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Scan status</h2>
                <p className="text-sm text-muted-foreground">
                  Review maintenance insights regularly to avoid shipping stale content or non-compliant products.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Current posture</p>
                  <p className="text-xs text-muted-foreground">
                    {flagged.length === 0
                      ? "All systems go"
                      : `${flagged.length} flagged for investigation`}
                  </p>
                </div>
                <Tag className="shrink-0" variant={flagged.length === 0 ? "success" : "warning"}>
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
