import "server-only";

import { sectionTemplateSchema, type SectionTemplate } from "@acme/types";
import { prisma } from "../../db";
import { nowIso } from "@acme/date-utils";
import type { Prisma } from "@prisma/client";

// JSON fallback loader (when Prisma model is unavailable)
async function loadJsonRepo() {
  return import("./sections.json.server");
}

type JsonObject = Prisma.InputJsonObject;

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const definedEntries = Object.entries(patch).filter(([, v]) => v !== undefined);
  return { ...base, ...(Object.fromEntries(definedEntries) as Partial<T>) };
}

export async function getSections(shop: string): Promise<SectionTemplate[]> {
  try {
    const delegate = (prisma as unknown as { sectionTemplate?: { findMany: Function } }).sectionTemplate;
    if (!delegate) throw new Error("SectionTemplate model not available");
    const rows = (await (delegate.findMany as any)({ where: { shopId: shop } })) as { data?: unknown }[];
    return rows.map((r) => sectionTemplateSchema.parse((r as any).data ?? r));
  } catch (err) {
    // Fallback to JSON backend
    const jsonRepo = await loadJsonRepo();
    return jsonRepo.getSections(shop);
  }
}

export async function saveSection(
  shop: string,
  section: SectionTemplate,
  _previous?: SectionTemplate,
): Promise<SectionTemplate> {
  try {
    const delegate = (prisma as unknown as { sectionTemplate?: { upsert: Function } }).sectionTemplate;
    if (!delegate) throw new Error("SectionTemplate model not available");
    await (delegate.upsert as any)({
      where: { id: section.id },
      update: {
        data: section as unknown as JsonObject,
        label: section.label,
        status: section.status,
        tags: (section.tags ?? []) as unknown as JsonObject,
        thumbnail: section.thumbnail ?? null,
      },
      create: {
        id: section.id,
        shopId: shop,
        label: section.label,
        status: section.status,
        tags: (section.tags ?? []) as unknown as JsonObject,
        thumbnail: section.thumbnail ?? null,
        data: section as unknown as JsonObject,
      },
    });
    return section;
  } catch (err) {
    const jsonRepo = await loadJsonRepo();
    return jsonRepo.saveSection(shop, section, _previous);
  }
}

export async function deleteSection(shop: string, id: string): Promise<void> {
  try {
    const delegate = (prisma as unknown as { sectionTemplate?: { deleteMany: Function } }).sectionTemplate;
    if (!delegate) throw new Error("SectionTemplate model not available");
    const res = await (delegate.deleteMany as any)({ where: { id, shopId: shop } });
    if (!res || typeof res.count !== "number" || res.count === 0) {
      throw new Error(`Section ${id} not found in ${shop}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) throw err;
    const jsonRepo = await loadJsonRepo();
    await jsonRepo.deleteSection(shop, id);
  }
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

  try {
    const delegate = (prisma as unknown as { sectionTemplate?: { update: Function } }).sectionTemplate;
    if (!delegate) throw new Error("SectionTemplate model not available");
    await (delegate.update as any)({
      where: { id: updated.id },
      data: {
        data: updated as unknown as JsonObject,
        label: updated.label,
        status: updated.status,
        tags: (updated.tags ?? []) as unknown as JsonObject,
        thumbnail: updated.thumbnail ?? null,
      },
    });
    return updated;
  } catch (err) {
    const jsonRepo = await loadJsonRepo();
    return jsonRepo.updateSection(shop, patch, previous);
  }
}
