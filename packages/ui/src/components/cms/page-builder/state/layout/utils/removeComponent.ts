import type { PageComponent } from "@acme/types";

export function removeComponent(list: PageComponent[], id: string): PageComponent[] {
  return list
    .map((c) =>
      "children" in c && Array.isArray(c.children)
        ? { ...c, children: removeComponent(c.children, id) } as PageComponent
        : c,
    )
    .filter((c) => c.id !== id);
}

