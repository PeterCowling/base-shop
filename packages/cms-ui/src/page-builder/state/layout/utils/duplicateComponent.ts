import type { PageComponent } from "@acme/types";

import { cloneWithNewIds } from "./cloneWithNewIds";

export function duplicateComponent(list: PageComponent[], id: string): PageComponent[] {
  let duplicated = false;
  const result: PageComponent[] = [];
  for (const c of list) {
    if (!duplicated && c.id === id) {
      const clone = cloneWithNewIds(c);
      result.push(c, clone);
      duplicated = true;
      continue;
    }
    if (!duplicated) {
      const childList = (c as { children?: PageComponent[] }).children;
      if (Array.isArray(childList)) {
        const children = duplicateComponent(childList, id);
        if (children !== childList) {
          result.push({ ...c, children } as PageComponent);
          duplicated = true;
          continue;
        }
      }
    }
    result.push(c);
  }
  return duplicated ? result : list;
}

