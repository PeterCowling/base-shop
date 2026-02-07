import { useCallback } from "react";

import type { PageComponent } from "@acme/types";

import type { Action } from "../state";
import { groupIntoContainer, ungroupContainer } from "../state/layout/utils";

interface Args {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
}

const useGroupingActions = ({ components, selectedIds, dispatch }: Args) => {
  const groupAs = useCallback((type: "Section" | "MultiColumn") => {
    if ((selectedIds?.length ?? 0) < 2) return;
    const next = groupIntoContainer(components, selectedIds, type);
    dispatch({ type: "set", components: next });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Grouped into ${type}` })); } catch {}
  }, [components, dispatch, selectedIds]);

  const ungroup = useCallback(() => {
    if ((selectedIds?.length ?? 0) !== 1) return;
    const id = selectedIds[0]!;
    const next = ungroupContainer(components, id);
    if (next !== components) {
      dispatch({ type: "set", components: next });
      try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Ungrouped" })); } catch {}
    }
  }, [components, dispatch, selectedIds]);

  return { groupAs, ungroup };
};

export default useGroupingActions;

