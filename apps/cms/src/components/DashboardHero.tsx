import Link from "next/link";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";
import { JumpLinkButton } from "@cms/app/cms/components/JumpLinkButton";
import { buildQuickStats } from "@cms/lib/dashboardData";
import type { Stats } from "@cms/lib/dashboardData";

type DashboardHeroProps = {
  stats: Stats;
  pendingCount: number;
  canManageRequests: boolean;
  pendingHeadingId: string;
};

export function DashboardHero({
  stats,
  pendingCount,
  canManageRequests,
  pendingHeadingId,
}: DashboardHeroProps) {
  const quickStats = buildQuickStats(stats);
  const totalAccounts = stats.users + pendingCount;
  const approvalProgress =
    totalAccounts === 0 ? 100 : Math.round((stats.users / totalAccounts) * 100);
  const progressLabel =
    pendingCount === 0
      ? "All account requests processed"
      : `${pendingCount} pending ${pendingCount === 1 ? "request" : "requests"}`;

  const heroDescription =
    stats.shops === 0
      ? "Create your first shop to unlock dashboards, live previews, and automated maintenance."
      : "Monitor storefront performance, team access, and catalog health from a single control centre.";

  const pendingSummaryVariant = pendingCount === 0 ? "success" : "warning";
  const pendingSummaryText =
    pendingCount === 0 ? "No pending approvals" : `${pendingCount} awaiting review`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-slate-950 text-foreground shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.35),_transparent_55%)]" />
      <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              Base-Shop CMS
            </span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Operate every storefront with confidence
            </h1>
            <p className="text-muted-foreground">{heroDescription}</p>
          </div>
          <div className="space-y-4">
            <Progress value={approvalProgress} label={progressLabel} />
            <div className="flex flex-wrap gap-3">
              {canManageRequests && (
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/configurator">Create new shop</Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-border/40 text-foreground hover:bg-muted/10"
              >
                <Link href="/cms/dashboard">View shop dashboards</Link>
              </Button>
              {canManageRequests && pendingCount > 0 && (
                <JumpLinkButton
                  targetId={pendingHeadingId}
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-border/40 text-foreground hover:bg-muted/10"
                >
                  Review account requests
                </JumpLinkButton>
              )}
            </div>
          </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <Card
              key={stat.label}
              className="border border-border/20 bg-background/60 text-foreground backdrop-blur"
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
              <h2 className="text-lg font-semibold">Access control</h2>
              <p className="text-sm text-muted-foreground">
                Keep the workspace safe by approving new teammates promptly.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/15 bg-background/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Pending approvals</p>
                <p className="text-xs text-muted-foreground">
                  We’ll surface new requests as soon as they arrive.
                </p>
              </div>
              <Tag variant={pendingSummaryVariant}>{pendingSummaryText}</Tag>
            </div>
            <p className="text-xs text-muted-foreground">
              Assign the right mix of roles so each collaborator has the access they need.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
