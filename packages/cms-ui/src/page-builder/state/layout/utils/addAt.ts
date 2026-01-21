import type { PageComponent } from "@acme/types";

export function addAt(list: PageComponent[], index: number, item: PageComponent) {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

