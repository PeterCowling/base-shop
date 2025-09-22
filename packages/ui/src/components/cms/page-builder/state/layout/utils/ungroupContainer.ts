import type { PageComponent } from "@acme/types";

export function ungroupContainer(list: PageComponent[], id: string): PageComponent[] {
  const expand = (nodes: PageComponent[]): PageComponent[] => {
    const result: PageComponent[] = [];
    for (const n of nodes) {
      if (n.id === id && Array.isArray((n as any).children)) {
        const kids = ((n as any).children as PageComponent[]) ?? [];
        result.push(...kids);
      } else if (Array.isArray((n as any).children)) {
        result.push({
          ...n,
          children: expand((n as any).children as PageComponent[]),
        } as PageComponent);
      } else {
        result.push(n);
      }
    }
    return result;
  };
  return expand(list);
}

