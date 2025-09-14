import "server-only";

import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

import type {
  Settings,
  SettingsDiffEntry,
} from "./settings.json.server";

type SettingsRepo = {
  getShopSettings(shop: string): Promise<Settings>;
  saveShopSettings(shop: string, settings: Settings): Promise<void>;
  diffHistory(shop: string): Promise<SettingsDiffEntry[]>;
};

let repoPromise: Promise<SettingsRepo> | undefined;

async function getRepo(): Promise<SettingsRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo<SettingsRepo>(
      () => (prisma as { setting?: unknown }).setting,
      () =>
        import("./settings.prisma.server").then(
          (m) => m.prismaSettingsRepository,
        ),
      () =>
        import("./settings.json.server").then(
          (m) => m.jsonSettingsRepository,
        ),
      { backendEnvVar: "SETTINGS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function getShopSettings(shop: string): Promise<Settings> {
  const repo = await getRepo();
  return repo.getShopSettings(shop);
}

export async function saveShopSettings(
  shop: string,
  settings: Settings,
): Promise<void> {
  const repo = await getRepo();
  return repo.saveShopSettings(shop, settings);
}

export async function diffHistory(
  shop: string,
): Promise<SettingsDiffEntry[]> {
  const repo = await getRepo();
  return repo.diffHistory(shop);
}

export type { Settings, SettingsDiffEntry } from "./settings.json.server";

