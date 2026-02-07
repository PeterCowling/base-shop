import type { PageComponent } from "@acme/types";

import { addAt } from "./addAt";

export function addComponent(
  list: PageComponent[],
  parentId: string | undefined,
  index: number | undefined,
  component: PageComponent,
): PageComponent[] {
  if (!parentId) {
    return addAt(list, index ?? list.length, component);
  }
  return list.map((c) => {
    if (c.id === parentId && "children" in c) {
      const childList = (c as { children?: PageComponent[] }).children ?? [];
      const children = addAt(childList, index ?? childList.length, component);
      return { ...c, children } as PageComponent;
    }
    if (
      "children" in c &&
      Array.isArray((c as { children?: PageComponent[] }).children)
    ) {
      return {
        ...c,
        children: addComponent(
          (c as PageComponent & { children: PageComponent[] }).children,
          parentId,
          index,
          component,
        ),
      } as PageComponent;
    }
    return c;
  });
}

