import "server-only";

import { prisma } from "../db";

export async function getThemePresets(
  shop: string,
): Promise<Record<string, Record<string, string>>> {
  const db = prisma as any;
  if (!db.themePreset) return {};
  const rows = await db.themePreset.findMany({ where: { shopId: shop } });
  const result: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    result[row.name] = row.tokens as Record<string, string>;
  }
  return result;
}

export async function saveThemePreset(
  shop: string,
  name: string,
  tokens: Record<string, string>,
): Promise<void> {
  const db = prisma as any;
  if (!db.themePreset) return;
  await db.themePreset.upsert({
    where: { shopId_name: { shopId: shop, name } },
    create: { shopId: shop, name, tokens },
    update: { tokens },
  });
}

export async function deleteThemePreset(
  shop: string,
  name: string,
): Promise<void> {
  const db = prisma as any;
  if (!db.themePreset) return;
  try {
    await db.themePreset.delete({
      where: { shopId_name: { shopId: shop, name } },
    });
  } catch {
    // ignore
  }
}

export const prismaThemePresetRepository = {
  getThemePresets,
  saveThemePreset,
  deleteThemePreset,
};
