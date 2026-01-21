import "server-only";

import { prisma } from "../db";

import { resolveRepo } from "./repoResolver";

type PrismaWithThemePreset = { themePreset?: unknown };

type ThemePresetRepo = {
  getThemePresets(shop: string): Promise<Record<string, Record<string, string>>>;
  saveThemePreset(
    shop: string,
    name: string,
    tokens: Record<string, string>,
  ): Promise<void>;
  deleteThemePreset(shop: string, name: string): Promise<void>;
};

let repoPromise: Promise<ThemePresetRepo> | undefined;

async function getRepo(): Promise<ThemePresetRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo<ThemePresetRepo>(
      () => (prisma as PrismaWithThemePreset).themePreset,
      () =>
        import("./themePresets.prisma.server").then(
          (m) => m.prismaThemePresetRepository,
        ),
      () =>
        import("./themePresets.json.server").then(
          (m) => m.jsonThemePresetRepository,
        ),
      { backendEnvVar: "THEME_PRESETS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function getThemePresets(
  shop: string,
): Promise<Record<string, Record<string, string>>> {
  const repo = await getRepo();
  return repo.getThemePresets(shop);
}

export async function saveThemePreset(
  shop: string,
  name: string,
  tokens: Record<string, string>,
): Promise<void> {
  const repo = await getRepo();
  return repo.saveThemePreset(shop, name, tokens);
}

export async function deleteThemePreset(
  shop: string,
  name: string,
): Promise<void> {
  const repo = await getRepo();
  return repo.deleteThemePreset(shop, name);
}
