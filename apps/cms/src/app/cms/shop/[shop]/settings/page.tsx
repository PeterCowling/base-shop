// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { authOptions } from "@cms/auth/options";
import { readSettings, readShop } from "@platform-core/repositories/json";
import type { Locale } from "@types";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";

const ShopEditor = dynamic(() => import("./ShopEditor"));
void ShopEditor;

export const revalidate = 0;

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
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
      <h3 className="mt-4 font-medium">Languages</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {settings.languages.map((l: Locale) => (
          <li key={l}>{l.toUpperCase()}</li>
        ))}
      </ul>
      <h3 className="mt-4 font-medium">Theme</h3>
      <p className="mt-2 text-sm">{info.themeId}</p>
      <h3 className="mt-4 font-medium">Theme Tokens</h3>
      <pre className="mt-2 rounded bg-gray-50 p-2 text-sm">
        {JSON.stringify(info.themeTokens, null, 2)}
      </pre>
      <h3 className="mt-4 font-medium">Catalog Filters</h3>
      <p className="mt-2 text-sm">{info.catalogFilters.join(", ")}</p>
      <h3 className="mt-4 font-medium">Filter Mappings</h3>
      <pre className="mt-2 rounded bg-gray-50 p-2 text-sm">
        {JSON.stringify(info.filterMappings, null, 2)}
      </pre>
      {isAdmin && (
        <div className="mt-6">
          <ShopEditor shop={shop} initial={info} />
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
