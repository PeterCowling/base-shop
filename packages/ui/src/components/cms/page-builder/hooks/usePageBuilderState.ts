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
            const valid = historyStateSchema.parse(fromServer) as HistoryState;
            return { ...(valid as HistoryState), present: migrate(valid.present) } as HistoryState;
          } catch {
            return { past: [], present: initial, future: [], gridCols: 12, editor: {} as Record<string, any> } as any;
          }
        })()
      : ({ past: [], present: initial, future: [], gridCols: 12, editor: {} as Record<string, any> } as any);

    if (typeof window === "undefined") {
      return parsedServer;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) throw new Error("no stored state");
      const parsed = historyStateSchema.parse(JSON.parse(stored)) as HistoryState;
      return { ...(parsed as HistoryState), present: migrate(parsed.present) } as HistoryState;
    } catch {
      return parsedServer;
    }
  });

  const typedState = useMemo<HistoryState>(
    () => historyStateSchema.parse(state) as HistoryState,
    [state]
  );
  const components = typedState.present;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      // Arrow key nudging for absolutely positioned blocks when no modifier except Shift/Alt
      const lower = e.key.toLowerCase();
      if (lower === "arrowleft" || lower === "arrowright" || lower === "arrowup" || lower === "arrowdown") {
        e.preventDefault();
        const canvas = typeof document !== "undefined" ? document.getElementById("canvas") : null;
        const unit = canvas?.offsetWidth ? canvas.offsetWidth / typedState.gridCols : null;
        const step = e.altKey && unit ? unit : e.shiftKey ? 10 : 1;
        const adjust = (val?: string, delta?: number) => {
          const s = (val ?? "0").trim();
          const n = s.endsWith("px") ? parseFloat(s) : Number(s);
          const base = Number.isNaN(n) ? 0 : n;
          return `${Math.round(base + (delta ?? 0))}px`;
        };
        const find = (list: PageComponent[], cid: string): PageComponent | null => {
          for (const c of list) {
            if (c.id === cid) return c;
            const children = (c as { children?: PageComponent[] }).children;
            if (Array.isArray(children)) {
              const found = find(children, cid);
              if (found) return found;
            }
          }
          return null;
        };
        selectedIds.forEach((id) => {
          const comp = find(components, id) as (PageComponent & { position?: string; left?: string; top?: string; locked?: boolean }) | null;
          const locked = ((typedState as any).editor?.[id]?.locked ?? (comp as any)?.locked ?? false) as boolean;
          if (!comp || locked || comp.position !== "absolute") return;
          if (lower === "arrowleft") {
            dispatch({ type: "resize", id, left: adjust(comp.left, -step) });
          } else if (lower === "arrowright") {
            dispatch({ type: "resize", id, left: adjust(comp.left, step) });
          } else if (lower === "arrowup") {
            dispatch({ type: "resize", id, top: adjust(comp.top, -step) });
          } else if (lower === "arrowdown") {
            dispatch({ type: "resize", id, top: adjust(comp.top, step) });
          }
        });
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
      } else if (k === "]" && e.shiftKey) {
        // Cmd/Ctrl + Shift + ] : bring to front (zIndex to 999) when selection exists; otherwise rotate right
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            dispatch({ type: "update-editor", id, patch: { zIndex: 999 } as any });
          });
          setLiveMessage("Brought to front");
        } else {
          onRotateDevice?.("right");
        }
      } else if (k === "[" && e.shiftKey) {
        // Cmd/Ctrl + Shift + [ : send to back (zIndex to 0) when selection exists; otherwise rotate left
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            dispatch({ type: "update-editor", id, patch: { zIndex: 0 } as any });
          });
          setLiveMessage("Sent to back");
        } else {
          onRotateDevice?.("left");
        }
      } else if (k === "]" && !e.shiftKey) {
        // Cmd/Ctrl + ] : bring forward (zIndex + 1)
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            const z = (typedState as any).editor?.[id]?.zIndex ?? 0;
            dispatch({ type: "update-editor", id, patch: { zIndex: z + 1 } as any });
          });
          setLiveMessage("Brought forward");
        }
      } else if (k === "[" && !e.shiftKey) {
        // Cmd/Ctrl + [ : send backward (zIndex - 1)
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            const z = (typedState as any).editor?.[id]?.zIndex ?? 0;
            const newZ = Math.max(0, z - 1);
            dispatch({ type: "update-editor", id, patch: { zIndex: newZ } as any });
          });
          setLiveMessage("Sent backward");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch, onSaveShortcut, onTogglePreview, onRotateDevice, components, selectedIds, typedState.gridCols]);

  const clearHistory = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    state,
    components,
    dispatch,
    selectedIds,
    setSelectedIds,
    liveMessage,
    storageKey,
    clearHistory,
  };
}

export default usePageBuilderState;
