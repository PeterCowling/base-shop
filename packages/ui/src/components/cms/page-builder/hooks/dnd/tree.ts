import type { PageComponent, HistoryState } from "@acme/types";
import type { ComponentType } from "../../defaults";
import { isHiddenForViewport } from "../../state/layout/utils";
import type { ParentKind } from "../../rules";

export function hasChildren(
  c: PageComponent
): c is PageComponent & { children: PageComponent[] } {
  return Array.isArray((c as { children?: unknown }).children);
}

export function findById(
  list: PageComponent[],
  id: string
): PageComponent | null {
  for (const c of list) {
    if (c.id === id) return c;
    const children = hasChildren(c) ? c.children : undefined;
    if (children) {
      const found = findById(children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentId(
  list: PageComponent[],
  target: string,
  pid?: string
): string | undefined {
  for (const c of list) {
    if (c.id === target) return pid;
    const children = (c as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      const res = findParentId(children, target, c.id);
      if (res !== undefined) return res;
    }
  }
  return undefined;
}

export function getTypeOfId(
  list: PageComponent[],
  id: string | number | symbol | undefined
): ComponentType | null {
  if (!id) return null;
  const node = findById(list, String(id));
  return (node?.type as ComponentType) || null;
}

export function getVisibleComponents(
  list: PageComponent[],
  editor?: HistoryState["editor"],
  viewport?: "desktop" | "tablet" | "mobile"
): PageComponent[] {
  return list.filter(
    (c) => !isHiddenForViewport(c.id, editor, (c as { hidden?: boolean }).hidden, viewport)
  );
}

export function resolveParentKind(
  components: PageComponent[],
  parentId?: string
): ParentKind {
  return parentId
    ? ((findById(components, parentId)?.type as ComponentType) || ("" as ComponentType))
    : ("ROOT" as ParentKind);
}
