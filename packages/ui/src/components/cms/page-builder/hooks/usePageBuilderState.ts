"use client";
import {
  type Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { useTranslations } from "@acme/i18n";
import type { HistoryState,Page, PageComponent } from "@acme/types";

import { type Action,historyStateSchema, reducer } from "../state";
import type { EditorFlags } from "../state/layout/types";

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
  const t = useTranslations();
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
            return { ...valid, present: migrate(valid.present) } as HistoryState;
          } catch {
            const fallback: HistoryState = {
              past: [],
              present: initial,
              future: [],
              gridCols: 12,
              editor: {} as Record<string, EditorFlags>,
            };
            return fallback;
          }
        })()
      : ({
          past: [],
          present: initial,
          future: [],
          gridCols: 12,
          editor: {} as Record<string, EditorFlags>,
        } as HistoryState);

    if (typeof window === "undefined") {
      return parsedServer;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) throw new Error("no stored state"); // i18n-exempt -- INTL-204 internal debug message not user-facing [ttl=2026-12-31]
      const parsed = historyStateSchema.parse(JSON.parse(stored)) as HistoryState;
      return { ...parsed, present: migrate(parsed.present) } as HistoryState;
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
        setLiveMessage(t("cms.builder.live.blockAdded"));
      } else if (action.type === "move") {
        setLiveMessage(t("cms.builder.live.blockMoved"));
      } else if (action.type === "resize") {
        setLiveMessage(t("cms.builder.live.blockResized"));
      } else if (action.type === "duplicate") {
        setLiveMessage(t("cms.builder.live.blockDuplicated"));
      } else if (action.type === "remove") {
        setLiveMessage(t("cms.builder.live.blockDeleted"));
      }
    },
    [rawDispatch, t]
  );

  useEffect(() => {
    // Allow other components (e.g., sidebar alignment controls) to announce
    const handleAnnounce = (e: Event) => {
      try {
        const ce = e as CustomEvent<string>;
        if (typeof ce.detail === "string") setLiveMessage(ce.detail);
      } catch {
        // ignore
      }
    };
    window.addEventListener("pb-live-message", handleAnnounce as EventListener);
    return () => window.removeEventListener("pb-live-message", handleAnnounce as EventListener);
  }, []);

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
      // Reorder selected block among siblings: Alt+Shift+ArrowUp/Down
      if ((e.altKey && e.shiftKey) && (e.key.toLowerCase() === 'arrowup' || e.key.toLowerCase() === 'arrowdown')) {
        if (selectedIds.length !== 1) return;
        const targetId = selectedIds[0]!;
        const findParentAndIndex = (
          nodes: PageComponent[],
          id: string,
          parentId?: string
        ): { parentId?: string; index: number } | null => {
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i] as { id: string; children?: PageComponent[] } & PageComponent;
            if (n.id === id) return { parentId, index: i };
            const kids = n.children as PageComponent[] | undefined;
            if (Array.isArray(kids)) {
              const got = findParentAndIndex(kids, id, n.id);
              if (got) return got;
            }
          }
          return null;
        };
        const locateList = (nodes: PageComponent[], pid?: string): PageComponent[] => {
          if (!pid) return nodes;
          for (const c of nodes) {
            const cc = c as { id: string; children?: PageComponent[] } & PageComponent;
            if (cc.id === pid) return (cc.children ?? []) as PageComponent[];
            const kids = cc.children as PageComponent[] | undefined;
            if (Array.isArray(kids)) {
              const res = locateList(kids, pid);
              if (res) return res;
            }
          }
          return nodes;
        };
        const info = findParentAndIndex(components, targetId, undefined);
        if (!info) return;
        const list = locateList(components, info.parentId);
        const last = Math.max(0, list.length - 1);
        const dir = e.key.toLowerCase() === 'arrowup' ? -1 : 1;
        const to = Math.min(last, Math.max(0, info.index + dir));
        if (to !== info.index) {
          e.preventDefault();
          dispatch({ type: 'move', from: { parentId: info.parentId, index: info.index }, to: { parentId: info.parentId, index: to } });
          setLiveMessage(t('cms.builder.live.blockReordered'));
        }
        return;
      }

      // Arrow key nudging for absolutely positioned blocks when no modifier except Shift/Alt
      const lower = e.key.toLowerCase();
      if (lower === "arrowleft" || lower === "arrowright" || lower === "arrowup" || lower === "arrowdown") {
        // If nothing is selected, allow normal page scroll behavior
        if (selectedIds.length === 0) return;
        const canvas = typeof document !== "undefined" ? document.getElementById("canvas") : null;
        const unit = canvas?.offsetWidth ? canvas.offsetWidth / typedState.gridCols : null;
        const step = e.altKey && unit ? unit : e.shiftKey ? 10 : 1;
        // removed unused helper: adjust
        const viewportEl = typeof document !== "undefined" ? document.querySelector('[data-viewport]') as HTMLElement | null : null;
        const vpRaw = viewportEl?.getAttribute('data-viewport') ?? 'desktop';
        const vp = (vpRaw === 'tablet' || vpRaw === 'mobile') ? vpRaw : 'desktop';
        const leftKey = vp === 'desktop' ? 'leftDesktop' : vp === 'tablet' ? 'leftTablet' : 'leftMobile';
        const topKey = vp === 'desktop' ? 'topDesktop' : vp === 'tablet' ? 'topTablet' : 'topMobile';
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
        // Identify any movable (absolute-positioned and unlocked) selections
        let handled = false;
        selectedIds.forEach((id) => {
          const comp = find(components, id) as (PageComponent & { position?: string; left?: string; top?: string; locked?: boolean; leftDesktop?: string; leftTablet?: string; leftMobile?: string; topDesktop?: string; topTablet?: string; topMobile?: string }) | null;
          const locked = (typedState.editor?.[id]?.locked ?? (comp as { locked?: boolean } | null)?.locked ?? false) as boolean;
          if (!comp || locked || comp.position !== "absolute") return;
          // We will handle at least one move; prevent default page scroll
          if (!handled) { e.preventDefault(); handled = true; }
          let el: HTMLElement | null = null;
          if (typeof document !== 'undefined') {
            const all = document.querySelectorAll(`[data-component-id="${id}"]`);
            el = (all.length ? (all[all.length - 1] as HTMLElement) : null);
          }
          const parent = el?.offsetParent as HTMLElement | null;
          const maxLeft = parent ? Math.max(0, parent.offsetWidth - (el?.offsetWidth || 0)) : null;
          const maxTop = parent ? Math.max(0, parent.offsetHeight - (el?.offsetHeight || 0)) : null;
          const clampPx = (raw: string | undefined, delta: number, max: number | null): string => {
            const s = (raw ?? "0").trim();
            const n = s.endsWith("px") ? parseFloat(s) : Number(s);
            const base = Number.isNaN(n) ? 0 : n;
            const next = base + delta;
            const clamped = max == null ? next : Math.min(Math.max(0, next), max);
            return `${Math.round(clamped)}px`;
          };
          if (lower === "arrowleft") {
            const current = (comp as Record<string, string | undefined>)[leftKey] ?? comp.left;
            dispatch({ type: "resize", id, [leftKey]: clampPx(current, -step, maxLeft) });
          } else if (lower === "arrowright") {
            const current = (comp as Record<string, string | undefined>)[leftKey] ?? comp.left;
            dispatch({ type: "resize", id, [leftKey]: clampPx(current, step, maxLeft) });
          } else if (lower === "arrowup") {
            const current = (comp as Record<string, string | undefined>)[topKey] ?? comp.top;
            dispatch({ type: "resize", id, [topKey]: clampPx(current, -step, maxTop) });
          } else if (lower === "arrowdown") {
            const current = (comp as Record<string, string | undefined>)[topKey] ?? comp.top;
            dispatch({ type: "resize", id, [topKey]: clampPx(current, step, maxTop) });
          }
        });
        // If we didn't move anything (no eligible absolute-positioned selection), allow default behavior
        if (handled) return;
        else return;
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
            dispatch({ type: "update-editor", id, patch: { zIndex: 999 } });
          });
          setLiveMessage(t("cms.builder.live.broughtToFront"));
        } else {
          onRotateDevice?.("right");
        }
      } else if (k === "[" && e.shiftKey) {
        // Cmd/Ctrl + Shift + [ : send to back (zIndex to 0) when selection exists; otherwise rotate left
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            dispatch({ type: "update-editor", id, patch: { zIndex: 0 } });
          });
          setLiveMessage(t("cms.builder.live.sentToBack"));
        } else {
          onRotateDevice?.("left");
        }
      } else if (k === "]" && !e.shiftKey) {
        // Cmd/Ctrl + ] : bring forward (zIndex + 1)
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            const z = typedState.editor?.[id]?.zIndex ?? 0;
            dispatch({ type: "update-editor", id, patch: { zIndex: z + 1 } });
          });
          setLiveMessage(t("cms.builder.live.broughtForward"));
        }
      } else if (k === "[" && !e.shiftKey) {
        // Cmd/Ctrl + [ : send backward (zIndex - 1)
        e.preventDefault();
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => {
            const z = typedState.editor?.[id]?.zIndex ?? 0;
            const newZ = Math.max(0, z - 1);
            dispatch({ type: "update-editor", id, patch: { zIndex: newZ } });
          });
          setLiveMessage(t("cms.builder.live.sentBackward"));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch, onSaveShortcut, onTogglePreview, onRotateDevice, components, selectedIds, typedState, t]);

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
