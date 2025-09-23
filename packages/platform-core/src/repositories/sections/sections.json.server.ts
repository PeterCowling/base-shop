/* eslint-disable security/detect-non-literal-fs-filename */
import "server-only";

import { sectionTemplateSchema, type SectionTemplate } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { validateShopName } from "../../shops/index";
import { DATA_ROOT } from "../../dataRoot";
import { nowIso } from "@acme/date-utils";

function sectionsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "sections.json");
}

function historyPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "sections.history.jsonl");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function writeSections(shop: string, list: SectionTemplate[]): Promise<void> {
  await ensureDir(shop);
  const tmp = `${sectionsPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, sectionsPath(shop));
}

async function appendHistory(shop: string, event: Record<string, unknown>): Promise<void> {
  const file = historyPath(shop);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const line = JSON.stringify({ ...event, at: nowIso() });
  await fs.appendFile(file, line + "\n", "utf8");
}

async function readSections(shop: string): Promise<SectionTemplate[]> {
  try {
    const buf = await fs.readFile(sectionsPath(shop), "utf8");
    const json = JSON.parse(buf);
    const parsed = sectionTemplateSchema.array().safeParse(json);
    if (parsed.success) return parsed.data;
    return json as SectionTemplate[];
  } catch {
    return [];
  }
}

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const definedEntries = Object.entries(patch).filter(([, v]) => v !== undefined);
  return { ...base, ...(Object.fromEntries(definedEntries) as Partial<T>) };
}

export async function getSections(shop: string): Promise<SectionTemplate[]> {
  return readSections(shop);
}

export async function saveSection(
  shop: string,
  section: SectionTemplate,
  previous?: SectionTemplate,
): Promise<SectionTemplate> {
  const list = await readSections(shop);
  const idx = list.findIndex((s) => s.id === section.id);
  if (idx === -1) list.push(section);
  else list[idx] = section;
  await writeSections(shop, list);
  await appendHistory(shop, { type: idx === -1 ? "create" : "update", id: section.id, before: previous ?? null, after: section });
  return section;
}

export async function deleteSection(shop: string, id: string): Promise<void> {
  const list = await readSections(shop);
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) throw new Error(`Section ${id} not found in ${shop}`);
  await writeSections(shop, next);
  await appendHistory(shop, { type: "delete", id });
}

export async function updateSection(
  shop: string,
  patch: Partial<SectionTemplate> & { id: string; updatedAt: string },
  previous: SectionTemplate,
): Promise<SectionTemplate> {
  if (previous.updatedAt !== patch.updatedAt) {
    throw new Error("Conflict: section has been modified");
  }
  const updated: SectionTemplate = mergeDefined(previous, patch);
  updated.updatedAt = nowIso();
  const list = await readSections(shop);
  const idx = list.findIndex((s) => s.id === patch.id);
  if (idx === -1) throw new Error(`Section ${patch.id} not found in ${shop}`);
  list[idx] = updated;
  await writeSections(shop, list);
  await appendHistory(shop, { type: "patch", id: patch.id, before: previous, after: updated });
  return updated;
}

export async function restoreSection(shop: string, snapshot: SectionTemplate): Promise<SectionTemplate> {
  const list = await readSections(shop);
  const idx = list.findIndex((s) => s.id === snapshot.id);
  if (idx === -1) list.push(snapshot);
  else list[idx] = snapshot;
  await writeSections(shop, list);
  await appendHistory(shop, { type: "restore", id: snapshot.id, after: snapshot });
  return snapshot;
}
