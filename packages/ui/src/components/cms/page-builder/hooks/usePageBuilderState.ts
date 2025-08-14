import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import { historyStateSchema, reducer, type Action } from "../state";

interface Params {
  page: Page;
  history?: HistoryState;
  onChange?: (components: PageComponent[]) => void;
}

export function usePageBuilderState({ page, history, onChange }: Params) {
  const storageKey = `page-builder-history-${page.id}`;
  const migrate = useCallback(
    (comps: PageComponent[]): PageComponent[] =>
      comps.map((c) =>
        c.type === "Section" || c.type === "MultiColumn"
          ? { ...c, children: c.children ?? [] }
          : c
      ),
    []
  );

  const [state, rawDispatch] = useReducer(reducer, undefined, (): HistoryState => {
    const initial = migrate(page.components as PageComponent[]);
    const fromServer = history ?? page.history;
    const parsedServer = fromServer
      ? (() => {
          try {
            const valid = historyStateSchema.parse(fromServer);
            return { ...valid, present: migrate(valid.present) };
          } catch {
            return { past: [], present: initial, future: [], gridCols: 12 };
          }
        })()
      : { past: [], present: initial, future: [], gridCols: 12 };

    if (typeof window === "undefined") {
      return parsedServer;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) throw new Error("no stored state");
      const parsed = historyStateSchema.parse(JSON.parse(stored));
      return { ...parsed, present: migrate(parsed.present) };
    } catch {
      console.warn("Failed to parse stored page builder state");
      return parsedServer;
    }
  });

  const components = state.present;
  const [gridCols, setGridCols] = useState(state.gridCols);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);
      if (action.type === "add") {
        setLiveMessage("Block added");
      } else if (action.type === "move") {
        setLiveMessage("Block moved");
      } else if (action.type === "resize") {
        setLiveMessage("Block resized");
      }
    },
    [rawDispatch]
  );

  useEffect(() => {
    if (!liveMessage) return;
    const t = setTimeout(() => setLiveMessage(""), 500);
    return () => clearTimeout(t);
  }, [liveMessage]);

  useEffect(() => {
    onChange?.(components);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [components, onChange, state, storageKey]);

  const prevId = useRef(page.id);
  const [publishCount, setPublishCount] = useState(0);
  const markPublished = useCallback(() => setPublishCount((c) => c + 1), []);
  useEffect(() => {
    const idChanged = prevId.current !== page.id;
    if (publishCount > 0 || idChanged) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    }
    if (idChanged) {
      prevId.current = page.id;
    }
  }, [page.id, publishCount, storageKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (k === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch]);

  return {
    components,
    dispatch,
    state,
    gridCols,
    setGridCols,
    selectedId,
    setSelectedId,
    liveMessage,
    markPublished,
  } as const;
}

export default usePageBuilderState;
