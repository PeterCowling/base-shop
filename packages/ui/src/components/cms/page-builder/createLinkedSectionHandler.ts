import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
import { saveGlobal } from "./libraryStore";
import type { Dispatch } from "react";
import type { Action } from "./state";

interface LinkedSectionOptions {
  shop?: string | null;
  components: PageComponent[];
  selectedIds: string[];
  dispatch: Dispatch<Action>;
  setSelectedIds: (ids: string[]) => void;
}

interface LinkedSectionItem {
  globalId: string;
  label: string;
  component: PageComponent;
}

const cloneWithNewIds = (node: PageComponent): PageComponent => {
  const cloned: any = { ...(node as any), id: ulid() };
  const children = (node as any).children as PageComponent[] | undefined;
  if (Array.isArray(children)) {
    cloned.children = children.map(cloneWithNewIds);
  }
  return cloned as PageComponent;
};

const findInsertIndex = (
  components: PageComponent[],
  selectedIds: string[],
): number => {
  const list = components as PageComponent[];
  const sel = selectedIds[0];
  if (!sel) return list.length;
  const pos = list.findIndex((c) => c.id === sel);
  return pos >= 0 ? pos + 1 : list.length;
};

export const createLinkedSectionHandler = ({
  shop,
  components,
  selectedIds,
  dispatch,
  setSelectedIds,
}: LinkedSectionOptions) =>
  async ({ globalId, label, component }: LinkedSectionItem) => {
    try {
      await saveGlobal(shop, {
        globalId,
        label,
        createdAt: Date.now(),
        template: component,
      } as any);
    } catch {}

    const cloned = cloneWithNewIds(component);
    const index = findInsertIndex(components, selectedIds);

    dispatch({ type: "add", component: cloned, index } as any);
    dispatch({
      type: "update-editor",
      id: cloned.id,
      patch: { global: { id: globalId } } as any,
    });
    setSelectedIds([cloned.id]);
  };
