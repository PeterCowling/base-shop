import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

import type { SectionPreset } from "@acme/types";

import { DATA_ROOT } from "../../dataRoot";
import { validateShopName } from "../../shops/index";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "section-presets.json");
}

async function read(shop: string): Promise<SectionPreset[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
    const buf = await fs.readFile(filePath(shop), "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? (json as SectionPreset[]) : [];
  } catch {
    return [];
  }
}

async function write(shop: string, list: SectionPreset[]): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
  await fs.mkdir(path.dirname(filePath(shop)), { recursive: true });
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
  await fs.rename(tmp, filePath(shop));
}

export async function listPresets(shop: string): Promise<SectionPreset[]> {
  return read(shop);
}

export async function savePreset(shop: string, preset: SectionPreset): Promise<SectionPreset> {
  const list = await read(shop);
  const idx = list.findIndex((p) => p.id === preset.id);
  if (idx === -1) list.push(preset);
  else list[idx] = preset;
  await write(shop, list);
  return preset;
}

export async function deletePreset(shop: string, id: string): Promise<void> {
  const list = await read(shop);
  const next = list.filter((p) => p.id !== id);
  await write(shop, next);
}
