// packages/platform-core/repositories/pages/index.server.ts
import "server-only";

import type { Page } from "@acme/types";
import { prisma } from "../../db";
import { resolveRepo } from "../repoResolver";
import type { PageDiffEntry } from "./types";

interface PagesModule {
  getPages(shop: string): Promise<Page[]>;
  savePage(shop: string, page: Page, previous?: Page): Promise<Page>;
  deletePage(shop: string, id: string): Promise<void>;
  updatePage(
    shop: string,
    patch: Partial<Page> & { id: string; updatedAt: string },
    previous: Page,
  ): Promise<Page>;
  diffHistory(shop: string): Promise<PageDiffEntry[]>;
}

let repoPromise: Promise<PagesModule> | undefined;

async function getRepo(): Promise<PagesModule> {
  if (!repoPromise) {
    repoPromise = resolveRepo<PagesModule>(
      () => prisma.page,
      () => import("./pages.prisma.server"),
      () => import("./pages.json.server"),
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

export async function diffHistory(shop: string): Promise<PageDiffEntry[]> {
  const repo = await getRepo();
  return repo.diffHistory(shop);
}

export type { PageDiffEntry } from "./types";
