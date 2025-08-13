import { z } from "zod";
import { pageComponentSchema } from "@acme/types";
import type { PageComponent, HistoryState } from "@acme/types";
import { ulid } from "ulid";

/* ════════════════ runtime validation (Zod) ════════════════ */
export const historyStateSchema: z.ZodType<HistoryState> = z
  .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
    gridCols: z.number().int().min(1).max(24).default(12),
  })
  .strict()
  .default({ past: [], present: [], future: [], gridCols: 12 });

/* ════════════════ reducers ════════════════ */
export type ChangeAction =
  | {
      type: "add";
      component: PageComponent;
      parentId?: string;
      index?: number;
    }
  | {
      type: "move";
      from: { parentId?: string; index: number };
      to: { parentId?: string; index: number };
    }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "update"; id: string; patch: Partial<PageComponent> }
  | {
      type: "resize";
      id: string;
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
    }
  | { type: "set"; components: PageComponent[] };

export type Action =
  | ChangeAction
  | { type: "undo" }
  | { type: "redo" }
  | { type: "set-grid-cols"; gridCols: number };

function addAt(list: PageComponent[], index: number, item: PageComponent) {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

function addComponent(
  list: PageComponent[],
  parentId: string | undefined,
  index: number | undefined,
  component: PageComponent
): PageComponent[] {
  if (!parentId) {
    return addAt(list, index ?? list.length, component);
  }
  return list.map((c) => {
    if (c.id === parentId && "children" in c) {
      const children = addAt(
        (c.children ?? []) as PageComponent[],
        index ?? (c.children?.length ?? 0),
        component
      );
      return { ...c, children } as PageComponent;
    }
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: addComponent(c.children, parentId, index, component) } as PageComponent;
    }
    return c;
  });
}

function removeComponent(list: PageComponent[], id: string): PageComponent[] {
  return list
    .map((c) =>
      "children" in c && Array.isArray(c.children)
        ? { ...c, children: removeComponent(c.children, id) } as PageComponent
        : c
    )
    .filter((c) => c.id !== id);
}

function cloneWithNewIds(component: PageComponent): PageComponent {
  const copy: PageComponent = { ...component, id: ulid() } as PageComponent;
  if ("children" in component && Array.isArray((component as any).children)) {
    (copy as any).children = (component as any).children.map((child: PageComponent) =>
      cloneWithNewIds(child)
    );
  }
  return copy;
}

function duplicateComponent(list: PageComponent[], id: string): PageComponent[] {
  let duplicated = false;
  const result: PageComponent[] = [];
  for (const c of list) {
    if (!duplicated && c.id === id) {
      const clone = cloneWithNewIds(c);
      result.push(c, clone);
      duplicated = true;
      continue;
    }
    if (!duplicated && "children" in c && Array.isArray((c as any).children)) {
      const children = duplicateComponent((c as any).children, id);
      if (children !== (c as any).children) {
        result.push({ ...(c as any), children } as PageComponent);
        duplicated = true;
        continue;
      }
    }
    result.push(c);
  }
  return duplicated ? result : list;
}

function updateComponent(
  list: PageComponent[],
  id: string,
  patch: Partial<PageComponent>
): PageComponent[] {
  const numericFields = [
    "minItems",
    "maxItems",
    "columns",
    "desktopItems",
    "tabletItems",
    "mobileItems",
  ] as const;
  const normalized: Partial<PageComponent> = { ...patch };
  for (const key of numericFields) {
    const val = (normalized as any)[key];
    if (typeof val === "string") {
      const num = Number(val);
      (normalized as any)[key] = Number.isNaN(num) ? undefined : num;
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

function resizeComponent(
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

function extractComponent(
  list: PageComponent[],
  parentId: string | undefined,
  index: number
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

function moveComponent(
  list: PageComponent[],
  from: { parentId?: string; index: number },
  to: { parentId?: string; index: number }
): PageComponent[] {
  const [item, without] = extractComponent(list, from.parentId, from.index);
  if (!item) return list;
  return addComponent(without, to.parentId, to.index, item);
}

function componentsReducer(
  state: PageComponent[],
  action: ChangeAction
): PageComponent[] {
  switch (action.type) {
    case "add":
      return addComponent(state, action.parentId, action.index, action.component);
    case "move":
      return moveComponent(state, action.from, action.to);
    case "remove":
      return removeComponent(state, action.id);
    case "duplicate":
      return duplicateComponent(state, action.id);
    case "update":
      return updateComponent(state, action.id, action.patch);
    case "resize":
      const normalize = (v?: string) => {
        if (v === undefined) return undefined;
        const trimmed = v.trim();
        if (trimmed === "") return undefined;
        return /^-?\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
      };
      const patch: {
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
      } = {};
      const width = normalize(action.width);
      const height = normalize(action.height);
      const left = normalize(action.left);
      const top = normalize(action.top);
      const widthDesktop = normalize(action.widthDesktop);
      const widthTablet = normalize(action.widthTablet);
      const widthMobile = normalize(action.widthMobile);
      const heightDesktop = normalize(action.heightDesktop);
      const heightTablet = normalize(action.heightTablet);
      const heightMobile = normalize(action.heightMobile);
      const marginDesktop = normalize(action.marginDesktop);
      const marginTablet = normalize(action.marginTablet);
      const marginMobile = normalize(action.marginMobile);
      const paddingDesktop = normalize(action.paddingDesktop);
      const paddingTablet = normalize(action.paddingTablet);
      const paddingMobile = normalize(action.paddingMobile);
      if (width !== undefined) patch.width = width;
      if (height !== undefined) patch.height = height;
      if (left !== undefined) patch.left = left;
      if (top !== undefined) patch.top = top;
      if (widthDesktop !== undefined) patch.widthDesktop = widthDesktop;
      if (widthTablet !== undefined) patch.widthTablet = widthTablet;
      if (widthMobile !== undefined) patch.widthMobile = widthMobile;
      if (heightDesktop !== undefined) patch.heightDesktop = heightDesktop;
      if (heightTablet !== undefined) patch.heightTablet = heightTablet;
      if (heightMobile !== undefined) patch.heightMobile = heightMobile;
      if (marginDesktop !== undefined) patch.marginDesktop = marginDesktop;
      if (marginTablet !== undefined) patch.marginTablet = marginTablet;
      if (marginMobile !== undefined) patch.marginMobile = marginMobile;
      if (paddingDesktop !== undefined) patch.paddingDesktop = paddingDesktop;
      if (paddingTablet !== undefined) patch.paddingTablet = paddingTablet;
      if (paddingMobile !== undefined) patch.paddingMobile = paddingMobile;
      return resizeComponent(state, action.id, patch);
    case "set":
      return action.components;
    default:
      return state;
  }
}

export function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        gridCols: state.gridCols,
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        gridCols: state.gridCols,
      };
    }
    case "set-grid-cols": {
      return { ...state, gridCols: action.gridCols };
    }
    default: {
      const next = componentsReducer(state.present, action as ChangeAction);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: [],
        gridCols: state.gridCols,
      };
    }
  }
}

// placeholder constant for tests to strip component code
export const palette = {};

export default reducer;
