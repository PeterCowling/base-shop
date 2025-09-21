import { useCallback, useEffect, useMemo, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import { ulid } from "ulid";
import { saveGlobal, updateGlobal, listGlobals, type GlobalItem } from "../libraryStore";

interface Args {
  components: PageComponent[];
  editor?: HistoryState["editor"];
  dispatch: (action: Action) => void;
  selectedComponent: PageComponent | null;
}

const useGlobals = ({ components, editor, dispatch, selectedComponent }: Args) => {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const [globals, setGlobals] = useState<GlobalItem[]>([]);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertSearch, setInsertSearch] = useState("");

  useEffect(() => {
    setGlobals(listGlobals(shop));
    const onChange = () => setGlobals(listGlobals(shop));
    window.addEventListener("pb-library-changed", onChange);
    return () => window.removeEventListener("pb-library-changed", onChange);
  }, [shop]);

  const makeGlobal = useCallback(async () => {
    if (!selectedComponent) return;
    const labelDefault = (selectedComponent as any).name || selectedComponent.type;
    const label = window.prompt("Name this Global component:", String(labelDefault))?.trim();
    if (!label) return;
    const gid = `gid_${ulid()}`;
    const item: GlobalItem = { globalId: gid, label, template: selectedComponent, createdAt: Date.now() } as any;
    await saveGlobal(shop, item);
    dispatch({ type: "update-editor", id: selectedComponent.id, patch: { global: { id: gid } } as any });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Made Global: ${label}` })); } catch {}
  }, [dispatch, selectedComponent, shop]);

  const applyGlobalToTree = useCallback((nodes: PageComponent[], eid: HistoryState["editor"] | undefined, globalId: string, template: PageComponent): PageComponent[] => {
    const map = eid ?? {};
    const recur = (list: PageComponent[]): PageComponent[] => list.map((n) => {
      const flags = (map as any)[n.id] as any;
      if (flags && flags.global && flags.global.id === globalId) {
        const clone: PageComponent = { ...(template as any), id: n.id } as any;
        return clone;
      }
      const kids = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(kids)) {
        const nextKids = recur(kids);
        if (nextKids !== kids) return { ...(n as any), children: nextKids } as any;
      }
      return n;
    });
    return recur(nodes);
  }, []);

  const editGlobally = useCallback(async () => {
    if (!selectedComponent) return;
    const eid = (editor ?? {})[selectedComponent.id] as any;
    const gid = eid?.global?.id as string | undefined;
    if (!gid) {
      window.alert("This block is not linked to a Global component yet. Use 'Make Global' first.");
      return;
    }
    const confirm = window.confirm("Apply current block state to the Global template and update all instances on this page?");
    if (!confirm) return;
    await updateGlobal(shop, gid, { template: selectedComponent });
    const next = applyGlobalToTree(components, editor, gid, selectedComponent);
    if (next !== components) {
      dispatch({ type: "set", components: next });
    }
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Updated Global and instances" })); } catch {}
  }, [components, dispatch, editor, selectedComponent, shop, applyGlobalToTree]);

  const insertGlobal = useCallback((g: GlobalItem) => {
    const clone = { ...(g.template as any), id: ulid() } as PageComponent;
    dispatch({ type: "add", component: clone, index: components.length });
    dispatch({ type: "update-editor", id: clone.id, patch: { global: { id: g.globalId } } as any });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Inserted Global: ${g.label}` })); } catch {}
    setInsertOpen(false);
  }, [components.length, dispatch]);

  return { globals, insertOpen, setInsertOpen, insertSearch, setInsertSearch, makeGlobal, editGlobally, insertGlobal };
};

export default useGlobals;

