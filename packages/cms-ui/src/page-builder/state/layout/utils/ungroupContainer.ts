import type { PageComponent } from "@acme/types";

export function ungroupContainer(list: PageComponent[], id: string): PageComponent[] {
  const expand = (nodes: PageComponent[]): PageComponent[] => {
    const result: PageComponent[] = [];
    for (const n of nodes) {
      const children = (n as unknown as { children?: PageComponent[] }).children;
      if (n.id === id && Array.isArray(children)) {
        const kids = children ?? [];
        result.push(...kids);
      } else if (Array.isArray(children)) {
        result.push({
          ...n,
          children: expand(children),
        } as PageComponent);
      } else {
        result.push(n);
      }
    }
    return result;
  };
  return expand(list);
}
