"use client";

import { resetThemeOverride } from "@cms/actions/shops.server";

import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";
import type { Locale } from "@acme/types";
import DataTable from "@acme/ui/components/cms/DataTable";
import { CodeBlock } from "@acme/ui/components/molecules";

import { Card, CardContent } from "@/components/atoms/shadcn";

import type { ThemeTokenRow } from "../lib/pageSections";
import {
  createThemeTokenColumns,
  themeTokenRowClassName,
} from "../tableMappers";

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
  const t = useTranslations();
  const CONFIG_ID = "configuration-overview"; // i18n-exempt -- CMS-TECH-001 internal section id [ttl=2026-01-01]
  const columns = createThemeTokenColumns({
    onReset: isAdmin
      ? ({ token }) => (
          <form action={resetThemeOverride.bind(null, shop, token)}>
            <button
              type="submit"
              className="text-xs text-link underline min-h-11 min-w-11"
            >
              {t("actions.reset")}
            </button>
          </form>
        )
      : undefined,
  });

  return (
    <section aria-labelledby={CONFIG_ID} className="space-y-4">
      <div className="space-y-2">
        <h2 id={CONFIG_ID} className="text-xl font-semibold">
          {t("cms.settings.configOverview.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.settings.configOverview.description")}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{t("cms.settings.configOverview.languageCoverage.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cms.settings.configOverview.languageCoverage.description")}
              </p>
            </div>
            {languages.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {languages.map((locale) => (
                  <li key={locale}>{locale.toUpperCase()}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("cms.settings.configOverview.languageCoverage.empty")}</p>
            )}
            <dl className="grid gap-2 text-sm text-muted-foreground">
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cms.settings.configOverview.catalogFilters")}
                </dt>
                <dd className="text-sm text-foreground">
                  {catalogFilters.length > 0
                    ? catalogFilters.join(", ")
                    : t("cms.settings.configOverview.noneConfigured")}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              <a
                href="/docs/cms/build-shop-guide.md#first-product"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
                onClick={() => {
                  track("build_flow_help_requested", {
                    shopId: shop,
                    stepId: "settings",
                    surface: "configurationOverview",
                  });
                }}
              >
                {t("cms.settings.configOverview.languageCoverage.helpLink")}
              </a>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{t("cms.settings.configOverview.commerceDefaults.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cms.settings.configOverview.commerceDefaults.description")}
              </p>
            </div>
            <dl className="grid gap-3 text-sm">
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cms.settings.configOverview.currency")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{currency || t("cms.settings.configOverview.notSet")}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cms.settings.configOverview.taxRegion")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{taxRegion || t("cms.settings.configOverview.notSet")}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cms.settings.configOverview.themePreset")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{themePreset ?? t("cms.settings.configOverview.notSet")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card id="theme-tokens" className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{t("cms.settings.configOverview.themeTokens.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cms.settings.configOverview.themeTokens.description")}
              </p>
              <p className="text-xs text-muted-foreground">
                <a
                  href="/docs/theming-charter.md"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {t("cms.settings.configOverview.themeTokens.docsLink")}
                </a>
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
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
              <h3 className="text-lg font-semibold">{t("cms.shopOverrides.filterMappings")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cms.settings.configOverview.filterMappings.description")}
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
