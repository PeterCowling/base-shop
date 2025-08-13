// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { authOptions } from "@cms/auth/options";
import { ensureAuthorized } from "@cms/actions/common/auth";
import { checkShopExists } from "@acme/lib";
import {
  readSettings,
  readShop,
  getShopById,
  updateShopInRepo,
} from "@platform-core/repositories/json.server";
import type { Locale, Shop } from "@acme/types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

const ShopEditor = dynamic(() => import("./ShopEditor"));
void ShopEditor;
const CurrencyTaxEditor = dynamic(() => import("./CurrencyTaxEditor"));
void CurrencyTaxEditor;

export const revalidate = 0;

async function resetToken(shop: string, key: string) {
  "use server";
  await ensureAuthorized();
  const current = await getShopById<Shop>(shop);
  const overrides = { ...(current.themeOverrides ?? {}) };
  delete overrides[key];
  const themeTokens = { ...(current.themeDefaults ?? {}), ...overrides };
  await updateShopInRepo(shop, {
    id: current.id,
    themeOverrides: overrides,
    themeTokens,
  });
  revalidatePath(`/cms/shop/${shop}/settings`);
}

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
              <th className="text-left">Color</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Object.keys(defaultTokens).sort().map((k) => {
              const defaultValue = defaultTokens[k];
              const override = overrides[k];
              const changed =
                override !== undefined && override !== defaultValue;
              return (
                <tr key={k} className={changed ? "bg-yellow-50" : undefined}>
                  <td className="pr-4 font-mono align-top">{k}</td>
                  <td className="pr-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded border"
                          style={{ background: defaultValue }}
                        />
                        <span className="font-mono">{defaultValue}</span>
                        {override && (
                          <span className="text-xs text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      {override && (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded border"
                            style={{ background: override }}
                          />
                          <span className="font-mono">{override}</span>
                          <span className="text-xs text-muted-foreground">
                            Override
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="pr-4 align-top">
                    {changed && isAdmin && (
                      <form action={resetToken.bind(null, shop, k)}>
                        <button
                          type="submit"
                          className="text-primary underline"
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
