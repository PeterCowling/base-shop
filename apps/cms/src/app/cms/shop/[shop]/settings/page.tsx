// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { authOptions } from "@cms/auth/options";
import { resetThemeOverride } from "@cms/actions/shops.server";
import { checkShopExists } from "@acme/lib";
import {
  readSettings,
  readShop,
} from "@platform-core/repositories/json.server";
import type { Locale } from "@acme/types";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import DataTable from "@ui/components/cms/DataTable";
import { CodeBlock } from "@ui/components/molecules";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createThemeTokenColumns,
  mapThemeTokenRows,
  themeTokenRowClassName,
} from "./tableMappers";

type ServiceEditorLink = {
  href: string;
  name: string;
  description: string;
};

function buildServiceEditors(shop: string): ServiceEditorLink[] {
  return [
    {
      href: `/cms/shop/${shop}/settings/seo`,
      name: "Search & discovery",
      description:
        "Tune metadata, AI catalog feeds, and sitemap refreshes so discovery flows stay current.",
    },
    {
      href: `/cms/shop/${shop}/settings/premier-delivery`,
      name: "Premier delivery",
      description:
        "Coordinate concierge shipping windows powered by the premier shipping plugin.",
    },
    {
      href: `/cms/shop/${shop}/settings/deposits`,
      name: "Deposit release",
      description:
        "Control the automated deposit refund cadence for rental orders.",
    },
    {
      href: `/cms/shop/${shop}/settings/returns`,
      name: "Returns",
      description:
        "Toggle carrier labels and return handling for inbound shipments.",
    },
    {
      href: `/cms/shop/${shop}/settings/reverse-logistics`,
      name: "Reverse logistics",
      description:
        "Schedule event ingestion to track cleaning, repair, QA, and ready statuses.",
    },
    {
      href: `/cms/shop/${shop}/settings/stock-alerts`,
      name: "Stock alerts",
      description:
        "Set thresholds, recipients, and webhooks for low stock notifications.",
    },
    {
      href: `/cms/shop/${shop}/settings/stock-scheduler`,
      name: "Stock scheduler",
      description:
        "Adjust background stock checks to avoid overlapping intervals.",
    },
    {
      href: `/cms/shop/${shop}/settings/maintenance-scan`,
      name: "Maintenance scan",
      description:
        "Define how often maintenance scans run to keep catalog metadata healthy.",
    },
  ];
}

const ShopEditor = dynamic(() => import("./ShopEditor"));
void ShopEditor;
const CurrencyTaxEditor = dynamic(() => import("./CurrencyTaxEditor"));
void CurrencyTaxEditor;

export const revalidate = 0;

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const [session, settings, info] = await Promise.all([
    getServerSession(authOptions),
    readSettings(shop),
    readShop(shop),
  ]);
  const isAdmin = session
    ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(
        session.user.role
      )
    : false;
  const defaultTokens = info.themeDefaults ?? {};
  const overrides = info.themeOverrides ?? {};
  const themeTokenRows = mapThemeTokenRows(defaultTokens, overrides);
  const themeTokenColumns = createThemeTokenColumns({
    onReset: isAdmin
      ? ({ token }) => (
          <form action={resetThemeOverride.bind(null, shop, token)}>
            <button
              type="submit"
              className="text-xs text-primary underline"
            >
              Reset
            </button>
          </form>
        )
      : undefined,
  });

  const languages = settings.languages ?? [];
  const catalogFilters = info.catalogFilters ?? [];
  const currency = settings.currency ?? "";
  const taxRegion = settings.taxRegion ?? "";
  const serviceEditors = buildServiceEditors(shop);
  const snapshotItems = [
    {
      label: "Languages",
      value: languages.length
        ? languages.map((locale: Locale) => locale.toUpperCase()).join(", ")
        : "Not configured",
    },
    {
      label: "Currency",
      value: currency || "Not set",
    },
    {
      label: "Tax region",
      value: taxRegion || "Not set",
    },
    {
      label: "Theme preset",
      value: info.themeId ?? "Not set",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.35),_transparent_55%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Shop settings
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Keep {shop} running smoothly
              </h1>
              <p className="text-white/80">
                Configure languages, service automations, and design tokens so {shop} stays on brand across every channel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 px-5 text-sm font-semibold">
                <Link href="#service-editors">Configure services</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-white/40 text-white hover:bg-white/10"
              >
                <Link href="#theme-tokens">Review theme tokens</Link>
              </Button>
            </div>
          </div>
          <Card className="border border-white/20 bg-white/5 text-white shadow-2xl backdrop-blur">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Current snapshot</h2>
                <p className="text-sm text-white/70">
                  {isAdmin
                    ? "You can update storefront details and commerce settings below."
                    : "You have read-only access. Contact an admin if changes are required."}
                </p>
              </div>
              <dl className="space-y-3 text-sm text-white/80">
                {snapshotItems.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">
                      {item.label}
                    </dt>
                    <dd className="text-sm font-medium text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="service-editors" aria-labelledby="service-editors-heading" className="space-y-4">
        <div className="space-y-2">
          <h2 id="service-editors-heading" className="text-xl font-semibold">
            Service automation
          </h2>
          <p className="text-sm text-muted-foreground">
            Each editor configures background jobs and optional plugins for this shop.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {serviceEditors.map((service) => (
            <Card key={service.href} className="h-full border border-border/80">
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <Link
                  href={service.href}
                  className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
                >
                  Manage {service.name}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="configuration-overview" className="space-y-4">
        <div className="space-y-2">
          <h2 id="configuration-overview" className="text-xl font-semibold">
            Configuration overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Reference the current language coverage, commerce defaults, and design system tokens before making updates.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Language coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Locales appear throughout the CMS navigation and storefront translation fallbacks.
                </p>
              </div>
              {languages.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {languages.map((locale: Locale) => (
                    <li key={locale}>{locale.toUpperCase()}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No languages configured.</p>
              )}
              <dl className="grid gap-2 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Catalog filters
                  </dt>
                  <dd className="text-sm text-foreground">
                    {catalogFilters.length > 0
                      ? catalogFilters.join(", ")
                      : "None configured"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Commerce defaults</h3>
                <p className="text-sm text-muted-foreground">
                  Align checkout currency and tax handling with finance requirements.
                </p>
              </div>
              <dl className="grid gap-3 text-sm">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Currency
                  </dt>
                  <dd className="text-sm font-medium text-foreground">{currency || "Not set"}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tax region
                  </dt>
                  <dd className="text-sm font-medium text-foreground">{taxRegion || "Not set"}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Theme preset
                  </dt>
                  <dd className="text-sm font-medium text-foreground">{info.themeId ?? "Not set"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card id="theme-tokens" className="lg:col-span-2">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Theme tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Compare defaults with overrides to keep components aligned with the Base-Shop palette.
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                <DataTable
                  rows={themeTokenRows}
                  columns={themeTokenColumns}
                  rowClassName={themeTokenRowClassName}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Filter mappings</h3>
                <p className="text-sm text-muted-foreground">
                  JSON mapping that connects catalog filters to upstream data sources.
                </p>
              </div>
              <CodeBlock
                code={JSON.stringify(info.filterMappings, null, 2)}
                preClassName="text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {isAdmin ? (
        <section id="admin-tools" aria-labelledby="admin-tools-heading" className="space-y-4">
          <div className="space-y-2">
            <h2 id="admin-tools-heading" className="text-xl font-semibold">
              Admin tools
            </h2>
            <p className="text-sm text-muted-foreground">
              Update storefront metadata, providers, and financial settings for this shop.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Shop profile</h3>
                <p className="text-sm text-muted-foreground">
                  Manage general details, theme options, and provider integrations.
                </p>
              </div>
              <ShopEditor
                shop={shop}
                initial={info}
                initialTrackingProviders={settings.trackingProviders ?? []}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Currency &amp; tax</h3>
                <p className="text-sm text-muted-foreground">
                  Set the defaults used for checkout and invoicing.
                </p>
              </div>
              <CurrencyTaxEditor
                shop={shop}
                initial={{
                  currency: settings.currency ?? "",
                  taxRegion: settings.taxRegion ?? "",
                }}
              />
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card className="border border-yellow-200 bg-yellow-50 text-yellow-900">
          <CardContent className="p-4">
            <p className="text-sm">
              You are signed in as a <b>viewer</b>. Editing is disabled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
