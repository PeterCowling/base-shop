import { useCallback, useEffect, useMemo, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { EditorFlags } from "../state/layout/types";
import type { Action } from "../state";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import { ulid } from "ulid";
import { saveGlobalForPage, updateGlobalForPage, listGlobalsForPage, listGlobals, saveGlobal, updateGlobal, type GlobalItem } from "../libraryStore";
import useLocalStrings from "./useLocalStrings";

interface Args {
  components: PageComponent[];
  editor?: HistoryState["editor"];
  dispatch: (action: Action) => void;
  selectedComponent: PageComponent | null;
  pageId?: string | null;
}

const useGlobals = ({ components, editor, dispatch, selectedComponent, pageId }: Args) => {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const [globals, setGlobals] = useState<GlobalItem[]>([]);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertSearch, setInsertSearch] = useState("");
  const t = useLocalStrings();

  useEffect(() => {
    const listFn = pageId ? listGlobalsForPage : listGlobals;
    setGlobals(listFn(shop, pageId ?? null));
    const onChange = () => setGlobals(listFn(shop, pageId ?? null));
    window.addEventListener("pb-library-changed", onChange);
    return () => window.removeEventListener("pb-library-changed", onChange);
  }, [shop, pageId]);

  const makeGlobal = useCallback(async () => {
    if (!selectedComponent) return;
    type Named = { name?: string };
    const labelDefault = (selectedComponent as Named).name ?? selectedComponent.type;
    const label = window
      .prompt(t("prompt_make_global"), String(labelDefault))
      ?.trim();
    if (!label) return;
    const gid = `gid_${ulid()}`;
    const item: GlobalItem = {
      globalId: gid,
      label,
      template: selectedComponent,
      createdAt: Date.now(),
    };
    if (pageId) {
      await saveGlobalForPage(shop, pageId ?? null, item);
    } else {
      await saveGlobal(shop, item);
    }
    dispatch({
      type: "update-editor",
      id: selectedComponent.id,
      patch: { global: { id: gid } },
    });
    try {
      window.dispatchEvent(
        new CustomEvent("pb-live-message", { detail: t("msg_made_global", { label }) })
      );
    } catch {}
  }, [dispatch, selectedComponent, shop, pageId, t]);

  const applyGlobalToTree = useCallback((nodes: PageComponent[], eid: HistoryState["editor"] | undefined, globalId: string, template: PageComponent): PageComponent[] => {
    const map = (eid ?? {}) as Record<string, EditorFlags>;
    const recur = (list: PageComponent[]): PageComponent[] => list.map((n) => {
      const flags = map[n.id];
      if (flags?.global && flags.global.id === globalId) {
        const clone: PageComponent = { ...(template as PageComponent), id: n.id } as PageComponent;
        return clone;
      }
      const kids = ("children" in n ? (n as { children?: PageComponent[] }).children : undefined);
      if (Array.isArray(kids)) {
        const nextKids = recur(kids);
        if (nextKids !== kids) {
          const nodeWithChildren = n as PageComponent & { children?: PageComponent[] };
          return { ...nodeWithChildren, children: nextKids } as PageComponent;
        }
      }
      return n;
    });
    return recur(nodes);
  }, []);

  const editGlobally = useCallback(async () => {
    if (!selectedComponent) return;
    const eidFlags = editor?.[selectedComponent.id];
    const gid = eidFlags?.global?.id as string | undefined;
    if (!gid) {
      window.alert(t("warn_not_global"));
      return;
    }
    const confirm = window.confirm(t("confirm_apply_global"));
    if (!confirm) return;
    if (pageId) {
      await updateGlobalForPage(shop, pageId ?? null, gid, { template: selectedComponent });
    } else {
      await updateGlobal(shop, gid, { template: selectedComponent });
    }
    const next = applyGlobalToTree(components, editor, gid, selectedComponent);
    if (next !== components) {
      dispatch({ type: "set", components: next });
    }
    try {
      window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("msg_updated_global") }));
    } catch {}
  }, [components, dispatch, editor, selectedComponent, shop, pageId, applyGlobalToTree, t]);

  const insertGlobal = useCallback((g: GlobalItem) => {
    const clone = { ...(g.template as PageComponent), id: ulid() } as PageComponent;
    dispatch({ type: "add", component: clone, index: components.length });
    dispatch({ type: "update-editor", id: clone.id, patch: { global: { id: g.globalId } } });
    try {
      window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("msg_inserted_global", { label: g.label }) }));
    } catch {}
    setInsertOpen(false);
  }, [components.length, dispatch, t]);

  return { globals, insertOpen, setInsertOpen, insertSearch, setInsertSearch, makeGlobal, editGlobally, insertGlobal };
};

export default useGlobals;
