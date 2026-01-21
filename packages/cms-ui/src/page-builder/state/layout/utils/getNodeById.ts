import type { PageComponent } from "@acme/types";

import { walkTree } from "./walkTree";

export function getNodeById(
  list: PageComponent[],
  id: string,
): PageComponent | null {
  let found: PageComponent | null = null;
  walkTree(list, (n) => {
    if (found) return;
    if (n.id === id) found = n;
  });
  return found;
}

