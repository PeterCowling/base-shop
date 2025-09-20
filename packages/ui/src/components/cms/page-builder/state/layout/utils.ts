import type { PageComponent } from "@acme/types";
import { ulid as generateId } from "ulid";

export function addAt(list: PageComponent[], index: number, item: PageComponent) {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

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

export function removeComponent(list: PageComponent[], id: string): PageComponent[] {
  return list
    .map((c) =>
      "children" in c && Array.isArray(c.children)
        ? { ...c, children: removeComponent(c.children, id) } as PageComponent
        : c,
    )
    .filter((c) => c.id !== id);
}

export function cloneWithNewIds(component: PageComponent): PageComponent {
  const copy: PageComponent = { ...component, id: generateId() };
  const childList = (component as { children?: PageComponent[] }).children;
  if (Array.isArray(childList)) {
    (copy as { children?: PageComponent[] }).children = childList.map((child) =>
      cloneWithNewIds(child),
    );
  }
  return copy;
}

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

export function updateComponent(
  list: PageComponent[],
  id: string,
  patch: Partial<PageComponent>,
): PageComponent[] {
  const numericFields = [
    "minItems",
    "maxItems",
    "columns",
    "desktopItems",
    "tabletItems",
    "mobileItems",
    "zIndex",
  ] as const;
  type NumericField = (typeof numericFields)[number];
  const normalized: Partial<PageComponent> & Record<NumericField, number | undefined> = {
    ...patch,
  } as Partial<PageComponent> & Record<NumericField, number | undefined>;
  for (const key of numericFields) {
    const val = (patch as Record<NumericField, unknown>)[key];
    if (typeof val === "string") {
      const num = Number(val);
      normalized[key] = Number.isNaN(num) ? undefined : (num as number);
    }
  }
  return list.map((c) => {
    if (c.id === id) return { ...c, ...normalized } as PageComponent;
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: updateComponent(c.children, id, normalized) } as PageComponent;
    }
    return c;
  });
}

export function resizeComponent(
  list: PageComponent[],
  id: string,
  patch: {
    width?: string;
    height?: string;
    left?: string;
    top?: string;
    right?: string;
    bottom?: string;
    leftDesktop?: string;
    leftTablet?: string;
    leftMobile?: string;
    topDesktop?: string;
    topTablet?: string;
    topMobile?: string;
    widthDesktop?: string;
    widthTablet?: string;
    widthMobile?: string;
    heightDesktop?: string;
    heightTablet?: string;
    heightMobile?: string;
    marginDesktop?: string;
    marginTablet?: string;
    marginMobile?: string;
    paddingDesktop?: string;
    paddingTablet?: string;
    paddingMobile?: string;
  },
): PageComponent[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch } as PageComponent;
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: resizeComponent(c.children, id, patch) } as PageComponent;
    }
    return c;
  });
}

export function extractComponent(
  list: PageComponent[],
  parentId: string | undefined,
  index: number,
): [PageComponent | null, PageComponent[]] {
  if (!parentId) {
    const item = list[index];
    const rest = [...list.slice(0, index), ...list.slice(index + 1)];
    return [item, rest];
  }
  let removed: PageComponent | null = null;
  const newList = list.map((c) => {
    if (removed) return c;
    if (c.id === parentId && "children" in c) {
      const childList = (c.children ?? []) as PageComponent[];
      const item = childList[index];
      removed = item ?? null;
      const rest = [...childList.slice(0, index), ...childList.slice(index + 1)];
      return { ...c, children: rest } as PageComponent;
    }
    if ("children" in c && Array.isArray(c.children)) {
      const [item, rest] = extractComponent(c.children, parentId, index);
      if (item) {
        removed = item;
        return { ...c, children: rest } as PageComponent;
      }
    }
    return c;
  });
  return [removed, newList];
}

export function moveComponent(
  list: PageComponent[],
  from: { parentId?: string; index: number },
  to: { parentId?: string; index: number },
): PageComponent[] {
  const [item, without] = extractComponent(list, from.parentId, from.index);
  if (!item) return list;
  return addComponent(without, to.parentId, to.index, item);
}

// Read-only tree helpers for selectors and outline UI
export function walkTree(
  list: PageComponent[],
  visit: (node: PageComponent, parent: PageComponent | undefined) => void,
  parent?: PageComponent,
): void {
  for (const node of list) {
    visit(node, parent);
    const children = (node as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      walkTree(children, visit, node);
    }
  }
}

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

export function getParentOfId(
  list: PageComponent[],
  id: string,
): PageComponent | null {
  let parent: PageComponent | null = null;
  walkTree(list, (n, p) => {
    if (parent) return;
    if (n.id === id) parent = p ?? null;
  });
  return parent;
}

export function flattenTree(list: PageComponent[]): PageComponent[] {
  const result: PageComponent[] = [];
  walkTree(list, (n) => {
    result.push(n);
  });
  return result;
}

// Decorators: merge editor flags onto nodes for read-only view rendering
export type Viewport = "desktop" | "tablet" | "mobile";
export type EditorMap = Record<string, { name?: string; locked?: boolean; zIndex?: number; hidden?: Viewport[] }> | undefined;

export function isHiddenForViewport(
  id: string,
  editor: EditorMap,
  fallbackHidden?: boolean,
  viewport?: Viewport,
): boolean {
  const flags = editor?.[id];
  if (!flags) return !!fallbackHidden;
  if (!flags.hidden) return !!fallbackHidden;
  if (!viewport) return flags.hidden.length > 0;
  return flags.hidden.includes(viewport);
}

export function decorateComponentForViewport<T extends PageComponent>(
  node: T,
  editor: EditorMap,
  viewport?: Viewport,
): T & { name?: string; locked?: boolean; zIndex?: number; hidden?: boolean } {
  const flags = (editor ?? {})[node.id] ?? {};
  const hidden = isHiddenForViewport(node.id, editor, (node as any).hidden as boolean | undefined, viewport);
  const merged: any = { ...node };
  if (flags.name !== undefined) merged.name = flags.name;
  if (flags.locked !== undefined) merged.locked = flags.locked;
  if (flags.zIndex !== undefined) merged.zIndex = flags.zIndex as number;
  if (hidden !== undefined) merged.hidden = hidden;
  return merged as T & { name?: string; locked?: boolean; zIndex?: number; hidden?: boolean };
}

export function decorateTreeForViewport(
  list: PageComponent[],
  editor: EditorMap,
  viewport?: Viewport,
): PageComponent[] {
  return list.map((n) => {
    const merged = decorateComponentForViewport(n, editor, viewport) as PageComponent & { children?: PageComponent[] };
    const children = merged.children;
    if (Array.isArray(children)) {
      merged.children = decorateTreeForViewport(children, editor, viewport);
    }
    return merged as PageComponent;
  });
}

// Group/Ungroup helpers
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
      const children = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(children)) walk(children, n.id);
    });
  };
  walk(list, undefined);
  indices = [...indices].sort((a, b) => a - b);
  if (indices.length !== ids.length) return list;
  // Extract items from the parent
  const removeAtIndices = (arr: PageComponent[], idxs: number[]) => {
    const result: PageComponent[] = [];
    arr.forEach((n, i) => { if (!idxs.includes(i)) result.push(n); });
    return result;
  };
  const insertAt = (arr: PageComponent[], idx: number, n: PageComponent) => [...arr.slice(0, idx), n, ...arr.slice(idx)];
  const build = (nodes: PageComponent[], p?: string): PageComponent[] => {
    if (p === parentId) {
      const children = nodes.filter((_, i) => indices.includes(i));
      const container: any = { id: generateId(), type, children: [...children] };
      if (type === "MultiColumn") container.columns = children.length || 2;
      const firstIndex = indices[0] ?? 0;
      const rest = removeAtIndices(nodes, indices);
      const next = insertAt(rest, firstIndex, container as PageComponent);
      return next;
    }
    return nodes.map((n) => {
      const kids = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(kids)) {
        return { ...n, children: build(kids, n.id) } as PageComponent;
      }
      return n;
    });
  };
  return build(list, undefined);
}

export function ungroupContainer(list: PageComponent[], id: string): PageComponent[] {
  const expand = (nodes: PageComponent[]): PageComponent[] => {
    const result: PageComponent[] = [];
    for (const n of nodes) {
      if (n.id === id && Array.isArray((n as any).children)) {
        const kids = ((n as any).children as PageComponent[]) ?? [];
        result.push(...kids);
      } else if (Array.isArray((n as any).children)) {
        result.push({ ...n, children: expand((n as any).children as PageComponent[]) } as PageComponent);
      } else {
        result.push(n);
      }
    }
    return result;
  };
  return expand(list);
}
