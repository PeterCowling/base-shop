import type { PageComponent } from "@acme/types";

import { walkTree } from "./walkTree";

export function getParentOfId(
  list: PageComponent[],
  id: string,
): PageComponent | null {
  let parent: PageComponent | null = null;
  walkTree(list, (n, p) => {
    if (parent) return;
    if (n.id === id) parent = p ?? null;
  });
  return parent;
}

