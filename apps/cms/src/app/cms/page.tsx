import { listPendingUsers } from "@cms/actions/accounts.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { readRbac } from "@cms/lib/server/rbacStore";
import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import fs from "fs/promises";
import path from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { Card, CardContent, Progress, Button, Tag } from "@/components/atoms/shadcn";
import { JumpLinkButton } from "./components/JumpLinkButton";
import { PendingRequestsPanel } from "./components/PendingRequestsPanel";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export const revalidate = 0;

type Stats = {
  users: number;
  shops: number;
  products: number;
};

type QuickStat = {
  label: string;
  value: string;
  caption: string;
};

const numberFormatter = new Intl.NumberFormat();

async function collectStats(): Promise<Stats> {
  const shopsDir = resolveDataRoot();

  let shops: string[] = [];
  try {
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    shops = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    shops = [];
  }

  let productCount = 0;
  await Promise.all(
    shops.map(async (shop) => {
      const file = path.join(shopsDir, shop, "products.json");
      try {
        const buf = await fs.readFile(file, "utf8");
        const json = JSON.parse(buf);
        if (Array.isArray(json)) productCount += json.length;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(`Failed reading ${file}`, err);
        }
      }
    })
  );

  const { users: usersMap } = await readRbac();

  return {
    users: Object.keys(usersMap).length,
    shops: shops.length,
    products: productCount,
  };
}

function buildQuickStats({ users, shops, products }: Stats): QuickStat[] {
  return [
    {
      label: "Active users",
      value: numberFormatter.format(users),
      caption:
        users === 0
          ? "Invite teammates to collaborate"
          : `${users === 1 ? "person" : "people"} with workspace access`,
    },
    {
      label: "Live shops",
      value: numberFormatter.format(shops),
      caption:
        shops === 0
          ? "Create your first shop to go live"
          : `${shops === 1 ? "storefront" : "storefronts"} active`,
    },
    {
      label: "Catalog size",
      value: numberFormatter.format(products),
      caption:
        products === 0
          ? "No products imported yet"
          : `${products === 1 ? "product" : "products"} across all shops`,
    },
  ];
}

const PENDING_HEADING_ID = "cms-pending-requests";

export default async function CmsDashboardPage() {
  const session = await getServerSession(authOptions);
  const { users, shops, products } = await collectStats();

  const canManageRequests = session?.user.role === "admin";
  const pending = canManageRequests ? await listPendingUsers() : [];

  const quickStats = buildQuickStats({ users, shops, products });

  const totalAccounts = users + pending.length;
  const approvalProgress =
    totalAccounts === 0 ? 100 : Math.round((users / totalAccounts) * 100);
  const progressLabel =
    pending.length === 0
      ? "All account requests processed"
      : `${pending.length} pending ${pending.length === 1 ? "request" : "requests"}`;

  const heroDescription =
    shops === 0
      ? "Create your first shop to unlock dashboards, live previews, and automated maintenance."
      : "Monitor storefront performance, team access, and catalog health from a single control centre.";

  const pendingSummaryTagVariant = pending.length === 0 ? "success" : "warning";
  const pendingSummaryText =
    pending.length === 0
      ? "No pending approvals"
      : `${pending.length} awaiting review`;

  const roles: Role[] = [
    "admin",
    "viewer",
    "ShopAdmin",
    "CatalogManager",
    "ThemeEditor",
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.35),_transparent_55%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Base-Shop CMS
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Operate every storefront with confidence
              </h1>
              <p className="text-white/80">{heroDescription}</p>
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
                  className="h-11 px-5 text-sm font-semibold border-white/40 text-white hover:bg-white/10"
                >
                  <Link href="/cms/dashboard">View shop dashboards</Link>
                </Button>
                {canManageRequests && pending.length > 0 && (
                  <JumpLinkButton
                    targetId={PENDING_HEADING_ID}
                    variant="outline"
                    className="h-11 px-5 text-sm font-semibold border-white/40 text-white hover:bg-white/10"
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
                <h2 className="text-lg font-semibold">Access control</h2>
                <p className="text-sm text-white/70">
                  Keep the workspace safe by approving new teammates promptly.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Pending approvals</p>
                  <p className="text-xs text-white/70">
                    We'll surface new requests as soon as they arrive.
                  </p>
                </div>
                <Tag variant={pendingSummaryTagVariant}>{pendingSummaryText}</Tag>
              </div>
              <p className="text-xs text-white/70">
                Assign the right mix of roles so each collaborator has the access they need.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border border-border/60">
          <CardContent className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Shop overview</h2>
              <p className="text-sm text-muted-foreground">
                Track the health of your storefront network and jump into the right workspace.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Operational footprint</p>
                  <p className="text-xs text-muted-foreground">
                    {shops === 0
                      ? "No storefronts live yet"
                      : `${shops} ${shops === 1 ? "shop" : "shops"} ready for merchandising`}
                  </p>
                </div>
                <Tag variant={shops > 0 ? "default" : "warning"}>
                  {shops > 0 ? "Active" : "Needs setup"}
                </Tag>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Catalog depth</p>
                  <p className="text-xs text-muted-foreground">
                    {products === 0
                      ? "Start importing products"
                      : `${products} items available across all shops`}
                  </p>
                </div>
                <Tag variant={products > 0 ? "default" : "warning"}>
                  {products > 0 ? "Populated" : "Empty"}
                </Tag>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Team access</p>
                  <p className="text-xs text-muted-foreground">
                    {users === 0
                      ? "Invite collaborators to share the workload"
                      : `${users} active ${users === 1 ? "member" : "members"}`}
                  </p>
                </div>
                <Tag variant={pending.length === 0 ? "success" : "warning"}>
                  {pending.length === 0 ? "Stable" : `${pending.length} pending`}
                </Tag>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/cms/live">Open live previews</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/cms/maintenance">Run maintenance scan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {canManageRequests ? (
          <PendingRequestsPanel
            pending={pending}
            roles={roles}
            headingId={PENDING_HEADING_ID}
          />
        ) : (
          <Card className="border border-border/60">
            <CardContent className="space-y-4">
              <h2
                id={PENDING_HEADING_ID}
                tabIndex={-1}
                className="text-lg font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Account requests
              </h2>
              <p className="text-sm text-muted-foreground">
                Only administrators can approve new accounts. Reach out to an admin if someone is waiting for access.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
