// apps/cms/src/app/cms/shop/[shop]/themes/page.tsx
import { listThemes, loadTokens } from "@platform-core/src/createShop";
import { readShop } from "@platform-core/src/repositories/shops.server";
import {
  getThemePresets,
  saveThemePreset,
  deleteThemePreset,
} from "@platform-core/src/repositories/themePresets.server";
import ThemeEditor from "./ThemeEditor";

export async function savePreset(
  shop: string,
  name: string,
  tokens: Record<string, string>,
) {
  "use server";
  await saveThemePreset(shop, name, tokens);
}

export async function deletePreset(shop: string, name: string) {
  "use server";
  await deleteThemePreset(shop, name);
}

export default async function ShopThemePage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const shopData = await readShop(shop);
  const builtInThemes = listThemes();
  const presets = await getThemePresets(shop);
  const themes = [...builtInThemes, ...Object.keys(presets)];
  const tokensByTheme = {
    ...Object.fromEntries(builtInThemes.map((t) => [t, loadTokens(t)])),
    ...presets,
  } as Record<string, Record<string, string>>;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme</h2>
      <ThemeEditor
        shop={shop}
        themes={themes}
        tokensByTheme={tokensByTheme}
        initialTheme={shopData.themeId}
        initialOverrides={shopData.themeOverrides}
        presets={Object.keys(presets)}
      />
    </div>
  );
}
