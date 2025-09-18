import { Card, CardContent } from "@/components/atoms/shadcn";
import { CodeBlock } from "@ui/components/molecules";
import DataTable from "@ui/components/cms/DataTable";
import { resetThemeOverride } from "@cms/actions/shops.server";
import type { Locale } from "@acme/types";

import {
  createThemeTokenColumns,
  themeTokenRowClassName,
} from "../tableMappers";
import type { ThemeTokenRow } from "../lib/pageSections";

interface ConfigurationOverviewProps {
  readonly shop: string;
  readonly isAdmin: boolean;
  readonly languages: Locale[];
  readonly catalogFilters: string[];
  readonly currency: string;
  readonly taxRegion: string;
  readonly themePreset?: string | null;
  readonly themeTokenRows: ThemeTokenRow[];
  readonly filterMappings: unknown;
}

export default function ConfigurationOverview({
  shop,
  isAdmin,
  languages,
  catalogFilters,
  currency,
  taxRegion,
  themePreset,
  themeTokenRows,
  filterMappings,
}: ConfigurationOverviewProps) {
  const columns = createThemeTokenColumns({
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

  return (
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
                {languages.map((locale) => (
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
                  {catalogFilters.length > 0 ? catalogFilters.join(", ") : "None configured"}
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
                <dd className="text-sm font-medium text-foreground">{themePreset ?? "Not set"}</dd>
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
                columns={columns}
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
              code={JSON.stringify(filterMappings ?? {}, null, 2)}
              preClassName="text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
