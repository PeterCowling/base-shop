// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

import {
  readSettings,
  readShop,
} from "@acme/platform-core/repositories/json.server";
import { checkShopExists } from "@acme/platform-core/shops";
import type { Locale } from "@acme/types";

import AdminTools from "./components/AdminTools";
import ConfigurationOverview from "./components/ConfigurationOverview";
import ServiceAutomationGrid from "./components/ServiceAutomationGrid";
import SettingsHero from "./components/SettingsHero";
import {
  buildServiceEditors,
  buildSnapshotItems,
  mapThemeTokenRows,
} from "./lib/pageSections";

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
        session.user.role,
      )
    : false;

  const languages = (settings.languages ?? []) as Locale[];
  const currency = settings.currency ?? "";
  const taxRegion = settings.taxRegion ?? "";
  const themePreset = info.themeId ?? null;
  const catalogFilters = info.catalogFilters ?? [];
  const filterMappings = info.filterMappings ?? {};
  const defaultTokens = info.themeDefaults ?? {};
  const overrides = info.themeOverrides ?? {};
  const themeTokenRows = mapThemeTokenRows(defaultTokens, overrides);
  const serviceEditors = buildServiceEditors(shop);
  const snapshotItems = buildSnapshotItems({
    languages,
    currency,
    taxRegion,
    themeId: themePreset,
  });
  const trackingProviders = settings.trackingProviders ?? [];

  return (
    <div className="space-y-10">
      <SettingsHero
        shop={shop}
        isAdmin={isAdmin}
        snapshotItems={snapshotItems}
      />
      <ServiceAutomationGrid services={serviceEditors} />
      <ConfigurationOverview
        shop={shop}
        isAdmin={isAdmin}
        languages={languages}
        catalogFilters={catalogFilters}
        currency={currency}
        taxRegion={taxRegion}
        themePreset={themePreset}
        themeTokenRows={themeTokenRows}
        filterMappings={filterMappings}
      />
      <AdminTools
        isAdmin={isAdmin}
        shop={shop}
        shopInfo={info}
        trackingProviders={trackingProviders}
        currency={currency}
        taxRegion={taxRegion}
      />
    </div>
  );
}
