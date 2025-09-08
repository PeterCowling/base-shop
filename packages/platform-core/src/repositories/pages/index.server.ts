import "server-only";

import type { Page } from "@acme/types";
import { prisma } from "../../db";
import { resolveRepo } from "../repoResolver";

// Lazily resolve the appropriate backend
let repoPromise:
  | Promise<typeof import("./pages.prisma.server")>
  | undefined;

async function getRepo(): Promise<typeof import("./pages.prisma.server")> {
  if (!repoPromise) {
    repoPromise = resolveRepo(
      () => (prisma as any).page,
      () => import("./pages.prisma.server"),
      () => import("./pages.json.server"),
      { backendEnvVar: "PAGES_BACKEND" },
    );
  }
  return repoPromise;
}

export async function getPages(shop: string): Promise<Page[]> {
  const repo = await getRepo();
  return repo.getPages(shop);
}

export async function savePage(
  shop: string,
  page: Page,
  previous?: Page,
): Promise<Page> {
  const repo = await getRepo();
  return repo.savePage(shop, page, previous);
}

export async function deletePage(shop: string, id: string): Promise<void> {
  const repo = await getRepo();
  return repo.deletePage(shop, id);
}

export async function updatePage(
  shop: string,
  patch: Partial<Page> & { id: string; updatedAt: string },
  previous: Page,
): Promise<Page> {
  const repo = await getRepo();
  return repo.updatePage(shop, patch, previous);
}

export interface PageDiffEntry {
  timestamp: string;
  diff: Partial<Page>;
}

export async function diffHistory(shop: string): Promise<PageDiffEntry[]> {
  const repo = await getRepo();
  return repo.diffHistory(shop);
}

