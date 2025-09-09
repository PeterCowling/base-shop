import "server-only";

import type { Page } from "@acme/types";
import { prisma } from "../../db";
import { resolveRepo } from "../repoResolver";

const jsonRepoPromise = import("./pages.json.server");

// Lazily resolve the appropriate backend
type PagesRepo = typeof import("./pages.prisma.server");

let repoPromise: Promise<PagesRepo> | undefined;

async function getRepo(): Promise<PagesRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo(
      () => (prisma as any).page,
      () => import("./pages.prisma.server"),
      () => jsonRepoPromise,
      // Select repository backend via PAGES_BACKEND env variable
      { backendEnvVar: "PAGES_BACKEND" },
    );
  }
  return repoPromise;
}

export async function getPages(shop: string): Promise<Page[]> {
  const repo = await getRepo();
  try {
    return await repo.getPages(shop);
  } catch (err) {
    const jsonRepo = await jsonRepoPromise;
    repoPromise = Promise.resolve(jsonRepo);
    return await jsonRepo.getPages(shop);
  }
}

export async function savePage(
  shop: string,
  page: Page,
  previous?: Page,
): Promise<Page> {
  const repo = await getRepo();
  try {
    return await repo.savePage(shop, page, previous);
  } catch (err) {
    const jsonRepo = await jsonRepoPromise;
    repoPromise = Promise.resolve(jsonRepo);
    return await jsonRepo.savePage(shop, page, previous);
  }
}

export async function deletePage(shop: string, id: string): Promise<void> {
  const repo = await getRepo();
  try {
    return await repo.deletePage(shop, id);
  } catch (err) {
    const jsonRepo = await jsonRepoPromise;
    repoPromise = Promise.resolve(jsonRepo);
    return await jsonRepo.deletePage(shop, id);
  }
}

export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string },
  previous: Page,
): Promise<Page> {
  const repo = await getRepo();
  try {
    return await repo.updatePage(shop, patch, previous);
  } catch (err) {
    const jsonRepo = await jsonRepoPromise;
    repoPromise = Promise.resolve(jsonRepo);
    return await jsonRepo.updatePage(shop, patch, previous);
  }
}

export interface PageDiffEntry {
  timestamp: string;
  diff: Partial<Page>;
}

export async function diffHistory(shop: string): Promise<PageDiffEntry[]> {
  const repo = await getRepo();
  try {
    return await repo.diffHistory(shop);
  } catch (err) {
    const jsonRepo = await jsonRepoPromise;
    repoPromise = Promise.resolve(jsonRepo);
    return await jsonRepo.diffHistory(shop);
  }
}

