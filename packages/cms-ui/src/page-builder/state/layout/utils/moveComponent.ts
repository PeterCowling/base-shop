import type { PageComponent } from "@acme/types";

import { addComponent } from "./addComponent";
import { extractComponent } from "./extractComponent";

export function moveComponent(
  list: PageComponent[],
  from: { parentId?: string; index: number },
  to: { parentId?: string; index: number },
): PageComponent[] {
  const [item, without] = extractComponent(list, from.parentId, from.index);
  if (!item) return list;
  return addComponent(without, to.parentId, to.index, item);
}

