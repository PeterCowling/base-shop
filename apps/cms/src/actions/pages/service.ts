// apps/cms/src/actions/pages/service.ts

import {
  deletePage as repoDeletePage,
  getPages as repoGetPages,
  savePage as repoSavePage,
  updatePage as repoUpdatePage,
} from "@acme/platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";

export function getPages(shop: string) {
  return repoGetPages(shop);
}

export function savePage(shop: string, page: Page, previous?: Page) {
  return repoSavePage(shop, page, previous);
}

export function updatePage(
  shop: string,
  page: Partial<Page> & { id: string; updatedAt: string },
  previous: Page
) {
  return repoUpdatePage(shop, page, previous);
}

export function deletePage(shop: string, id: string) {
  return repoDeletePage(shop, id);
}
