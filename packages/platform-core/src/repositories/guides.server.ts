import "server-only";

import type {
  GuideContentInput,
  GuidePublication,
} from "@acme/types";

import { prisma } from "../db";

import type { GuidesRepository } from "./guides.types";
import { resolveRepo } from "./repoResolver";

let repoPromise: Promise<GuidesRepository> | undefined;

async function getRepo(): Promise<GuidesRepository> {
  if (!repoPromise) {
    repoPromise = resolveRepo<GuidesRepository>(
      () => (prisma as { guide?: unknown }).guide,
      () =>
        import("./guides.prisma.server").then(
          (m) => m.prismaGuidesRepository,
        ),
      () =>
        import("./guides.json.server").then(
          (m) => m.jsonGuidesRepository,
        ),
      { backendEnvVar: "GUIDES_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readGuideRepo<T = GuidePublication>(
  shop: string,
): Promise<T[]> {
  const repo = await getRepo();
  return repo.read(shop);
}

export async function writeGuideRepo<T = GuidePublication>(
  shop: string,
  guides: T[],
): Promise<void> {
  const repo = await getRepo();
  return repo.write(shop, guides);
}

export async function getGuideById<
  T extends { id: string } = GuidePublication,
>(shop: string, id: string): Promise<T | null> {
  const repo = await getRepo();
  return repo.getById(shop, id);
}

export async function getGuideByKey(
  shop: string,
  key: string,
): Promise<GuidePublication | null> {
  const repo = await getRepo();
  return repo.getByKey(shop, key);
}

export async function updateGuideInRepo<
  T extends { id: string; row_version: number } = GuidePublication,
>(shop: string, patch: Partial<T> & { id: string }): Promise<T> {
  const repo = await getRepo();
  return repo.update(shop, patch);
}

export async function deleteGuideFromRepo(
  shop: string,
  id: string,
): Promise<void> {
  const repo = await getRepo();
  return repo.delete(shop, id);
}

export async function duplicateGuideInRepo<
  T extends GuidePublication = GuidePublication,
>(shop: string, id: string): Promise<T> {
  const repo = await getRepo();
  return repo.duplicate(shop, id);
}

export async function getGuideContent(
  shop: string,
  key: string,
  locale: string,
): Promise<GuideContentInput | null> {
  const repo = await getRepo();
  return repo.getContent(shop, key, locale);
}

export async function writeGuideContent(
  shop: string,
  key: string,
  locale: string,
  content: GuideContentInput,
): Promise<void> {
  const repo = await getRepo();
  return repo.writeContent(shop, key, locale, content);
}

export type { GuidesRepository };
