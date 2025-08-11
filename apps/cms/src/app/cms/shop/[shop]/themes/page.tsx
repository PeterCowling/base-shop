// apps/cms/src/app/cms/shop/[shop]/themes/page.tsx
import { listThemes, loadTokens } from "@platform-core/src/createShop";
import { readShop } from "@platform-core/src/repositories/shops.server";
import ThemeEditor from "./ThemeEditor";

export default async function ShopThemePage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const shopData = await readShop(shop);
  const themes = listThemes();
  const tokensByTheme = Object.fromEntries(
    themes.map((t) => [t, loadTokens(t)])
  ) as Record<string, Record<string, string>>;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme</h2>
      <ThemeEditor
        shop={shop}
        themes={themes}
        tokensByTheme={tokensByTheme}
        initialTheme={shopData.themeId}
        initialOverrides={shopData.themeTokens}
      />
    </div>
  );
}
