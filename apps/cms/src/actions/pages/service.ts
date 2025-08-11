// apps/cms/src/actions/pages/service.ts

import {
  getPages as repoGetPages,
  savePage as repoSavePage,
  updatePage as repoUpdatePage,
  deletePage as repoDeletePage,
} from "@platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";

export function getPages(shop: string) {
  return repoGetPages(shop);
}

export function savePage(shop: string, page: Page) {
  return repoSavePage(shop, page);
}

export function updatePage(
  shop: string,
  page: Partial<Page> & { id: string; updatedAt: string }
) {
  return repoUpdatePage(shop, page);
}

export function deletePage(shop: string, id: string) {
  return repoDeletePage(shop, id);
}
