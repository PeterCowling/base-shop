import "server-only";
import { promises as fs } from "fs";
import * as path from "path";
import { validateShopName } from "../../shops/index";
import { DATA_ROOT } from "../../dataRoot";
import type { SectionPreset } from "@acme/types";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "section-presets.json");
}

async function read(shop: string): Promise<SectionPreset[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? (json as SectionPreset[]) : [];
  } catch {
    return [];
  }
}

async function write(shop: string, list: SectionPreset[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath(shop)), { recursive: true });
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
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

