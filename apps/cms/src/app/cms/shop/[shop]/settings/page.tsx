// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { authOptions } from "@cms/auth/options";
import { resetThemeOverride } from "@cms/actions/shops.server";
import { checkShopExists } from "@acme/lib";
import {
  readSettings,
  readShop,
} from "@platform-core/repositories/json.server";
import type { Locale } from "@acme/types";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const HSL_RE =
  /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/;

function isColor(value: string) {
  return HEX_RE.test(value) || HSL_RE.test(value);
}

function swatchStyle(value: string) {
  return {
    backgroundColor: HSL_RE.test(value) ? `hsl(${value})` : value,
  } as const;
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

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Settings – {shop}</h2>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/seo`}
          className="text-primary underline"
        >
          SEO settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/premier-delivery`}
          className="text-primary underline"
        >
          Premier delivery settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/deposits`}
          className="text-primary underline"
        >
          Deposit release settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/returns`}
          className="text-primary underline"
        >
          Return service settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/reverse-logistics`}
          className="text-primary underline"
        >
          Reverse logistics settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/stock-alerts`}
          className="text-primary underline"
        >
          Stock alert settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/stock-scheduler`}
          className="text-primary underline"
        >
          Stock scheduler settings
        </Link>
      </p>
      <p className="mb-4 text-sm">
        <Link
          href={`/cms/shop/${shop}/settings/maintenance-scan`}
          className="text-primary underline"
        >
          Maintenance scan settings
        </Link>
      </p>
      <h3 className="mt-4 font-medium">Languages</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {settings.languages.map((l: Locale) => (
          <li key={l}>{l.toUpperCase()}</li>
        ))}
      </ul>
      <h3 className="mt-4 font-medium">Theme</h3>
      <p className="mt-2 text-sm">{info.themeId}</p>
      <h3 className="mt-4 font-medium">Theme Tokens</h3>
      <div className="mt-2">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="text-left">Token</th>
              <th className="text-left">Values</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(defaultTokens).sort().map((k) => {
              const override = overrides[k];
              const hasOverride = override !== undefined;
              const changed = hasOverride && override !== defaultTokens[k];
              return (
                <tr key={k} className={changed ? "bg-yellow-50" : undefined}>
                  <td className="pr-4 font-mono">{k}</td>
                  <td className="pr-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{defaultTokens[k]}</span>
                        {isColor(defaultTokens[k]) && (
                          <span
                            className="ml-1 inline-block h-4 w-4 rounded border align-middle"
                            style={swatchStyle(defaultTokens[k])}
                          />
                        )}
                        <span className="text-xs text-muted-foreground">default</span>
                      </div>
                      {hasOverride && (
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{override}</span>
                          {isColor(override) && (
                            <span
                              className="ml-1 inline-block h-4 w-4 rounded border align-middle"
                              style={swatchStyle(override)}
                            />
                          )}
                          <span className="text-xs text-muted-foreground">override</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="pr-4">
                    {hasOverride && isAdmin && (
                      <form action={resetThemeOverride.bind(null, shop, k)}>
                        <button
                          type="submit"
                          className="text-xs text-primary underline"
                        >
                          Reset
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {Object.keys(overrides ?? {}).length === 0 && (
          <span className="text-muted-foreground text-xs">
            (using theme defaults)
          </span>
        )}
      </div>
      <h3 className="mt-4 font-medium">Catalog Filters</h3>
      <p className="mt-2 text-sm">{info.catalogFilters.join(", ")}</p>
      <h3 className="mt-4 font-medium">Filter Mappings</h3>
      <div className="mt-2 flex items-center gap-2">
        <pre className="rounded bg-gray-50 p-2 text-sm">
          {JSON.stringify(info.filterMappings, null, 2)}
        </pre>
        {Object.keys(info.filterMappings ?? {}).length === 0 && (
          <span className="text-muted-foreground text-xs">
            (using theme defaults)
          </span>
        )}
      </div>
      <h3 className="mt-4 font-medium">Currency / Tax</h3>
      <p className="mt-2 text-sm">
        {settings.currency} – {settings.taxRegion}
      </p>
      {isAdmin && (
        <div className="mt-6">
          <ShopEditor
            shop={shop}
            initial={info}
            initialTrackingProviders={settings.trackingProviders ?? []}
          />
          <div className="mt-6">
            <CurrencyTaxEditor
              shop={shop}
              initial={{
                currency: settings.currency ?? "",
                taxRegion: settings.taxRegion ?? "",
              }}
            />
          </div>
        </div>
      )}
      {!isAdmin && (
        <p className="mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
          You are signed in as a <b>viewer</b>. Editing is disabled.
        </p>
      )}
    </div>
  );
}
