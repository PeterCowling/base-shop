import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";

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
  const copy: PageComponent = { ...component, id: ulid() };
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
