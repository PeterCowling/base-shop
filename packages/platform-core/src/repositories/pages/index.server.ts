import "server-only";

import type { Page } from "@acme/types";
import { prisma } from "../../db";
import { resolveRepo } from "../repoResolver";

// Lazily load the JSON repository only when needed so that importing this
// module doesn't immediately trigger the JSON backend. This allows tests to
// assert that the Prisma backend is selected by default without the JSON
// module being imported.
let jsonRepoPromise:
  | Promise<typeof import("./pages.json.server")>
  | undefined;

async function loadJsonRepo(): Promise<
  typeof import("./pages.json.server")
> {
  jsonRepoPromise ??= import("./pages.json.server");
  return jsonRepoPromise;
}

// Lazily resolve the appropriate backend
type PagesRepo = typeof import("./pages.prisma.server");

let repoPromise: Promise<PagesRepo> | undefined;

async function getRepo(): Promise<PagesRepo> {
  if (!repoPromise) {
      repoPromise = resolveRepo(
        () => (prisma as { page?: unknown }).page,
        () => import("./pages.prisma.server"),
        () => loadJsonRepo(),
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
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.getPages(shop);
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
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.savePage(shop, page, previous);
  }
}

export async function deletePage(shop: string, id: string): Promise<void> {
  const repo = await getRepo();
  try {
    return await repo.deletePage(shop, id);
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.deletePage(shop, id);
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
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.updatePage(shop, patch, previous);
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
  } catch {
    const jsonRepo = await loadJsonRepo();
    repoPromise = undefined;
    return jsonRepo.diffHistory(shop);
  }
}

export async function reorderPages(shop: string, ids: string[]): Promise<Page[]> {
  const repo = await getRepo();
  // Call backend reorder if available; otherwise fall back to JSON backend.
  const maybe = (repo as unknown as { reorderPages?: (s: string, i: string[]) => Promise<Page[]> }).reorderPages;
  if (typeof maybe === "function") {
    try {
      return await maybe(shop, ids);
    } catch {
      const jsonRepo = await loadJsonRepo();
      repoPromise = undefined;
      return jsonRepo.reorderPages(shop, ids);
    }
  }
  const jsonRepo = await loadJsonRepo();
  return jsonRepo.reorderPages(shop, ids);
}
