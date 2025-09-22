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
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-hero-foreground/80">
                Migrations
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Upgrade storefronts to the latest tokens
              </h1>
              <p className="text-hero-foreground/80">
                Keep every storefront consistent by running the migration CLI whenever design tokens or templates evolve.
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={30} label="Run migrate-shop from your terminal" labelClassName="text-hero-foreground/80" />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/configurator">Open configurator</Link>
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
            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-primary/15 bg-surface-2 text-foreground"
                >
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="border border-border/20 bg-surface-2 text-foreground shadow-elevation-5">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Status</h2>
                <p className="text-sm text-muted-foreground">
                  Migrations are orchestrated manually today. Automation hooks will arrive in a future release.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Automation</p>
                  <p className="text-xs text-muted-foreground">Scripted via migrate-shop CLI</p>
                </div>
                <Tag className="shrink-0" variant="warning">Manual step</Tag>
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
          <Card className="border border-border/60 bg-surface-3">
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
