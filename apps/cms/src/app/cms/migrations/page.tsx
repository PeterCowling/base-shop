import Link from "next/link";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";

export default function MigrationsPage() {
  const quickStats = [
    {
      label: "Migration flow",
      value: "CLI driven",
      caption: "Run the migrate-shop tool to move themes and tokens",
    },
    {
      label: "Primary focus",
      value: "Design tokens",
      caption: "Keeps typography, colors, and spacing in sync",
    },
    {
      label: "Environment",
      value: "Local workspace",
      caption: "Execute inside the repo checkout with access to shops",
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
                Migrations
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Upgrade storefronts to the latest tokens
              </h1>
              <p className="text-muted-foreground">
                Keep every storefront consistent by running the migration CLI whenever design tokens or templates evolve.
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={30} label="Run migrate-shop from your terminal" />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/configurator">Open configurator</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-border/40 text-foreground hover:bg-muted/10"
                >
                  <Link href="/cms">Return to CMS home</Link>
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
                <h2 className="text-lg font-semibold">Status</h2>
                <p className="text-sm text-muted-foreground">
                  Migrations are orchestrated manually today. Automation hooks will arrive in a future release.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Automation</p>
                  <p className="text-xs text-muted-foreground">Scripted via migrate-shop CLI</p>
                </div>
                <Tag variant="warning">Manual step</Tag>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border border-border/60">
        <CardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Run the migrate-shop CLI</h2>
          <p className="text-sm text-muted-foreground">
            From the root of the repository, execute the migration tool to align a shop’s theme tokens and templates with the latest release.
          </p>
          <Card className="border border-border/60 bg-muted/10">
            <CardContent className="font-mono text-sm text-foreground">
              pnpm migrate-shop --shop &lt;shop-id&gt;
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">
            After the script completes, verify the storefront locally and re-run the live preview to confirm the changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
