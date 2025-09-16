"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Reducer,
} from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import { historyStateSchema, reducer, type Action } from "../state";

interface Params {
  page: Page;
  history?: HistoryState;
  onChange?: (components: PageComponent[]) => void;
  onSaveShortcut?: () => void;
  onTogglePreview?: () => void;
  onRotateDevice?: (direction: "left" | "right") => void;
}

export function usePageBuilderState({
  page,
  history,
  onChange,
  onSaveShortcut,
  onTogglePreview,
  onRotateDevice,
}: Params) {
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

  const typedReducer: Reducer<HistoryState, Action> = reducer;
  const [state, rawDispatch] = useReducer(
    typedReducer,
    undefined,
    (): HistoryState => {
    const initial = migrate(page.components);
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
      return parsedServer;
    }
  });

  const typedState = useMemo<HistoryState>(
    () => historyStateSchema.parse(state),
    [state]
  );
  const components = typedState.present;
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
      localStorage.setItem(storageKey, JSON.stringify(typedState));
    }
  }, [components, onChange, storageKey, typedState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.tagName === "SELECT" ||
          e.target.isContentEditable)
      ) {
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (k === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      } else if (k === "s") {
        e.preventDefault();
        onSaveShortcut?.();
      } else if (k === "p") {
        e.preventDefault();
        onTogglePreview?.();
      } else if (k === "[" && e.shiftKey) {
        e.preventDefault();
        onRotateDevice?.("left");
      } else if (k === "]" && e.shiftKey) {
        e.preventDefault();
        onRotateDevice?.("right");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch, onSaveShortcut, onTogglePreview, onRotateDevice]);

  const clearHistory = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    state,
    components,
    dispatch,
    selectedId,
    setSelectedId,
    liveMessage,
    storageKey,
    clearHistory,
  };
}

export default usePageBuilderState;

