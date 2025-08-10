// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@lib/checkShopExists.server";
import {
  readSettings,
  readShop,
} from "@platform-core/repositories/json.server";
import type { Locale } from "@types";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

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
      <h3 className="mt-4 font-medium">Languages</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {settings.languages.map((l: Locale) => (
          <li key={l}>{l.toUpperCase()}</li>
        ))}
      </ul>
      <h3 className="mt-4 font-medium">Theme</h3>
      <p className="mt-2 text-sm">{info.themeId}</p>
      <h3 className="mt-4 font-medium">Theme Tokens</h3>
      <div className="mt-2 flex items-center gap-2">
        <pre className="rounded bg-gray-50 p-2 text-sm">
          {JSON.stringify(info.themeTokens, null, 2)}
        </pre>
        {Object.keys(info.themeTokens ?? {}).length === 0 && (
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
          <ShopEditor shop={shop} initial={info} />
          <div className="mt-6">
            <CurrencyTaxEditor
              shop={shop}
              initial={{ currency: settings.currency, taxRegion: settings.taxRegion }}
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
