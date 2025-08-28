"use server";

// apps/cms/src/app/cms/shop/[shop]/themes/page.tsx
import { listThemes } from "@platform-core/createShop";
import { baseTokens, loadThemeTokens } from "@platform-core/themeTokens";
import { readShop } from "@platform-core/repositories/shops.server";
import {
  getThemePresets,
  saveThemePreset,
  deleteThemePreset,
} from "@platform-core/repositories/themePresets.server";
import ThemeEditor from "./ThemeEditor";
import Link from "next/link";

export async function savePreset(
  shop: string,
  name: string,
  tokens: Record<string, string>,
) {
  await saveThemePreset(shop, name, tokens);
}

export async function deletePreset(shop: string, name: string) {
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
    ...Object.fromEntries(
      await Promise.all(
        builtInThemes.map(async (t: string) => [t, { ...baseTokens, ...(await loadThemeTokens(t)) }])
      )
    ),
    ...presets,
  } as Record<string, Record<string, string>>;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme</h2>
      <p className="mb-4 text-sm">
        <Link href="/cms/themes/library" className="text-primary underline">
          Theme Library
        </Link>
      </p>
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
