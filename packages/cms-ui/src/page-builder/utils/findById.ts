import type { PageComponent } from "@acme/types";

/**
 * Find a component by id in a tree of PageComponent items.
 */
export function findById(list: PageComponent[], id: string): PageComponent | null {
  for (const c of list) {
    if (c.id === id) return c;
    const children = (c as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      const found = findById(children, id);
      if (found) return found;
    }
  }
  return null;
}

export default findById;

