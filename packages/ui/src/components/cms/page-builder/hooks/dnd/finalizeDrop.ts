import { ulid } from "ulid";
import type { DragEndEvent } from "@dnd-kit/core";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../../state";
import type { ComponentType } from "../../defaults";
import { canDropChild, type ParentKind } from "../../rules";
import { findById, findParentId, getTypeOfId, resolveParentKind } from "./tree";
import type { MutableRefObject } from "react";
import { safeDispatchEvent } from "./dom";

type DragFrom = "palette" | "library" | "canvas";

type FinalizeArgs = {
  ev: DragEndEvent;
  components: PageComponent[];
  dispatch: (a: Action) => void;
  defaults: Record<string, Partial<PageComponent>>;
  containerTypes: ComponentType[];
  selectId: (id: string) => void;
  t?: (key: string, vars?: Record<string, unknown>) => string;
  lastTabHoverRef: MutableRefObject<{ parentId: string; tabIndex: number } | null>;
};

export function finalizeDrop({
  ev,
  components,
  dispatch,
  defaults,
  containerTypes,
  selectId,
  t,
  lastTabHoverRef,
}: FinalizeArgs) {
  const { active, over } = ev;
  if (!over) return;
  const a = active.data.current as {
    from: DragFrom;
    type?: ComponentType;
    index?: number;
    parentId?: string;
    template?: PageComponent;
    templates?: PageComponent[];
  };
  const o = (over.data.current || {}) as { parentId?: string; index?: number };

  let parentId = o.parentId;
  let index = o.index;

  if (over.id === "canvas") {
    parentId = undefined;
    index = components.length;
  } else if (parentId === undefined) {
    parentId = over.id.toString().replace(/^container-/, "");
    const parent = findById(components, parentId);
    index = parent ? (Array.isArray((parent as any).children) ? (parent as any).children.length : 0) : 0;
    if (!over.id.toString().startsWith("container-") && (!parent || !Array.isArray((parent as any).children))) {
      const overId = over.id.toString();
      const actualParentId = findParentId(components, overId, undefined);
      parentId = actualParentId;
      if (parentId) {
        const p = findById(components, parentId);
        const children = p && Array.isArray((p as any).children) ? (p as any).children as PageComponent[] : [];
        index = Math.max(0, children.findIndex((c) => c.id === overId));
      } else {
        index = Math.max(0, components.findIndex((c) => c.id === overId));
      }
    }
  }

  const parentKind: ParentKind = resolveParentKind(components, parentId);

  if (a?.from === "palette") {
    const isContainer = containerTypes.includes(a.type!);
    if (!canDropChild(parentKind, a.type as ComponentType)) {
      safeDispatchEvent('pb-live-message', typeof t === 'function' ? t('cannotPlace', { type: a.type }) : `Cannot place ${a.type} here`);
      return;
    }
    const component = {
      id: ulid(),
      type: a.type! as PageComponent["type"],
      ...(defaults[a.type!] ?? {}),
      ...(isContainer ? { children: [] } : {}),
    } as PageComponent;
    if (parentId && lastTabHoverRef.current?.parentId === parentId) {
      const parent = findById(components, parentId);
      const isTabbed = parent && (parent.type === 'Tabs' || parent.type === 'TabsAccordionContainer');
      if (isTabbed) (component as any).slotKey = String(lastTabHoverRef.current.tabIndex);
    }
    dispatch({ type: "add", component, parentId, index: index ?? 0 });
    selectId(component.id);
    return;
  }

  if (a?.from === "library" && (a.template || (a.templates && a.templates.length))) {
    const cloneWithIds = (node: PageComponent): PageComponent => {
      const cloned: any = { ...(node as any), id: ulid() };
      const children = (node as any).children as PageComponent[] | undefined;
      if (Array.isArray(children)) cloned.children = children.map(cloneWithIds);
      return cloned as PageComponent;
    };
    const list = (a.templates && a.templates.length ? a.templates : (a.template ? [a.template] : [])) as PageComponent[];
    const clones = list.map(cloneWithIds);
    const invalid = clones.find((c) => !canDropChild(parentKind, (c as any).type as ComponentType));
    if (invalid) {
      safeDispatchEvent('pb-live-message', typeof t === 'function' ? t('cannotPlace', { type: String((invalid as any).type) }) : `Cannot place ${String((invalid as any).type)} here`);
      return;
    }
    if (parentId && lastTabHoverRef.current?.parentId === parentId) {
      const parent = findById(components, parentId);
      const isTabbed = parent && (parent.type === 'Tabs' || parent.type === 'TabsAccordionContainer');
      if (isTabbed) clones.forEach((c) => { (c as any).slotKey = String(lastTabHoverRef.current!.tabIndex); });
    }
    let insertedFirstId: string | null = null;
    clones.forEach((component, i) => {
      dispatch({ type: "add", component, parentId, index: (index ?? 0) + i });
      if (!insertedFirstId) insertedFirstId = component.id;
    });
    if (insertedFirstId) selectId(insertedFirstId);
    return;
  }

  if (a?.from === "canvas") {
    let toIndex = index ?? 0;
    if (a.parentId === parentId && a.index! < (index ?? 0)) {
      toIndex = (index ?? 0) - 1;
    }
    const movingType = getTypeOfId(components, ev.active.id) || (a.type as ComponentType | null);
    if (movingType && !canDropChild(parentKind, movingType)) {
      safeDispatchEvent('pb-live-message', typeof t === 'function' ? t('cannotMove', { type: String(movingType) }) : `Cannot move ${String(movingType)} here`);
      return;
    }
    dispatch({ type: "move", from: { parentId: a.parentId, index: a.index! }, to: { parentId, index: toIndex } });
    if (parentId && lastTabHoverRef.current?.parentId === parentId) {
      const parent = findById(components, parentId);
      const isTabbed = parent && (parent.type === 'Tabs' || parent.type === 'TabsAccordionContainer');
      if (isTabbed) {
        const movedId = String(ev.active.id);
        dispatch({ type: 'update', id: movedId, patch: { slotKey: String(lastTabHoverRef.current.tabIndex) } as any });
        safeDispatchEvent('pb-live-message', typeof t === 'function' ? t('movedToTab', { n: String(lastTabHoverRef.current.tabIndex + 1) }) : `Moved to tab ${lastTabHoverRef.current.tabIndex + 1}`);
      }
    }
  }
}

