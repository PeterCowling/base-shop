import "server-only";

import type { SectionTemplate } from "@acme/types";

import { prisma } from "../../db";
import { resolveRepo } from "../repoResolver";

// Lazily load JSON backend
let jsonRepoPromise: Promise<typeof import("./sections.json.server")> | undefined;
async function loadJsonRepo() {
  jsonRepoPromise ??= import("./sections.json.server");
  return jsonRepoPromise;
}

type SectionsRepo = typeof import("./sections.prisma.server");
let repoPromise: Promise<SectionsRepo> | undefined;

async function getRepo(): Promise<SectionsRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo(
      () => (prisma as { sectionTemplate?: unknown }).sectionTemplate,
      () => import("./sections.prisma.server"),
      () => loadJsonRepo(),
      { backendEnvVar: "SECTIONS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function getSections(shop: string): Promise<SectionTemplate[]> {
  const repo = await getRepo();
  try {
    return await repo.getSections(shop);
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.getSections(shop);
  }
}

export async function saveSection(
  shop: string,
  section: SectionTemplate,
  previous?: SectionTemplate,
): Promise<SectionTemplate> {
  const repo = await getRepo();
  try {
    return await repo.saveSection(shop, section, previous);
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.saveSection(shop, section, previous);
  }
}

export async function deleteSection(shop: string, id: string): Promise<void> {
  const repo = await getRepo();
  try {
    return await repo.deleteSection(shop, id);
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.deleteSection(shop, id);
  }
}

export async function updateSection(
  shop: string,
  patch: Partial<SectionTemplate> & { id: string; updatedAt: string },
  previous: SectionTemplate,
): Promise<SectionTemplate> {
  const repo = await getRepo();
  try {
    return await repo.updateSection(shop, patch, previous);
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.updateSection(shop, patch, previous);
  }
}

