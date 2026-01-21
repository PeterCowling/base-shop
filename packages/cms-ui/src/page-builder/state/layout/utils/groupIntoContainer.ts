import { ulid as generateId } from "ulid";

import type { PageComponent } from "@acme/types";

export function groupIntoContainer(
  list: PageComponent[],
  ids: string[],
  type: "Section" | "MultiColumn",
): PageComponent[] {
  if (ids.length < 1) return list;
  // Find common parent and indices
  let parentId: string | undefined;
  let indices: number[] = [];
  const walk = (nodes: PageComponent[], p?: string) => {
    nodes.forEach((n, i) => {
      if (ids.includes(n.id)) {
        if (parentId === undefined) parentId = p;
        if (parentId === p) indices.push(i);
      }
      const children = (n as unknown as { children?: PageComponent[] }).children;
      if (Array.isArray(children)) walk(children, n.id);
    });
  };
  walk(list, undefined);
  indices = [...indices].sort((a, b) => a - b);
  if (indices.length !== ids.length) return list;
  // Extract items from the parent
  const removeAtIndices = (arr: PageComponent[], idxs: number[]) => {
    const result: PageComponent[] = [];
    arr.forEach((n, i) => {
      if (!idxs.includes(i)) result.push(n);
    });
    return result;
  };
  const insertAt = (arr: PageComponent[], idx: number, n: PageComponent) => [
    ...arr.slice(0, idx),
    n,
    ...arr.slice(idx),
  ];
  const build = (nodes: PageComponent[], p?: string): PageComponent[] => {
    if (p === parentId) {
      const children = nodes.filter((_, i) => indices.includes(i));
      const container: Record<string, unknown> = { id: generateId(), type, children: [...children] };
      if (type === "MultiColumn") (container as Record<string, unknown>).columns = children.length || 2;
      const firstIndex = indices[0] ?? 0;
      const rest = removeAtIndices(nodes, indices);
      const next = insertAt(rest, firstIndex, container as PageComponent);
      return next;
    }
    return nodes.map((n) => {
      const kids = (n as unknown as { children?: PageComponent[] }).children;
      if (Array.isArray(kids)) {
        return { ...n, children: build(kids, n.id) } as PageComponent;
      }
      return n;
    });
  };
  return build(list, undefined);
}
