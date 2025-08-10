// apps/cms/src/app/cms/shop/[shop]/themes/page.tsx
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@lib/checkShopExists.server";
import { readShop } from "@platform-core/repositories/json.server";
import { listThemes } from "@platform-core/createShop";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const ThemeEditor = dynamic(() => import("./ThemeEditor"));
void ThemeEditor;

export const revalidate = 0;

export default async function ThemePage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const [session, info] = await Promise.all([
    getServerSession(authOptions),
    readShop(shop),
  ]);
  const themes = listThemes();
  const isAdmin = session
    ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(
        session.user.role
      )
    : false;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme – {shop}</h2>
      {isAdmin ? (
        <ThemeEditor
          shop={shop}
          themes={themes}
          initialTheme={info.themeId}
          initialTokens={info.themeTokens}
        />
      ) : (
        <p className="mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
          You are signed in as a <b>viewer</b>. Editing is disabled.
        </p>
      )}
    </div>
  );
}

