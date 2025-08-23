import { useCallback, useEffect, useReducer, useState } from "react";
import { historyStateSchema, reducer } from "../state";
export function usePageBuilderState({ page, history, onChange, onSaveShortcut, onTogglePreview, onRotateDevice, }) {
    const storageKey = `page-builder-history-${page.id}`;
    const migrate = useCallback((comps) => comps.map((c) => c.type === "Section" || c.type === "MultiColumn"
        ? { ...c, children: c.children ?? [] }
        : c), []);
    const [state, rawDispatch] = useReducer(reducer, undefined, () => {
        const initial = migrate(page.components);
        const fromServer = history ?? page.history;
        const parsedServer = fromServer
            ? (() => {
                try {
                    const valid = historyStateSchema.parse(fromServer);
                    return { ...valid, present: migrate(valid.present) };
                }
                catch {
                    return { past: [], present: initial, future: [], gridCols: 12 };
                }
            })()
            : { past: [], present: initial, future: [], gridCols: 12 };
        if (typeof window === "undefined") {
            return parsedServer;
        }
        try {
            const stored = localStorage.getItem(storageKey);
            if (!stored)
                throw new Error("no stored state");
            const parsed = historyStateSchema.parse(JSON.parse(stored));
            return { ...parsed, present: migrate(parsed.present) };
        }
        catch {
            return parsedServer;
        }
    });
    const components = state.present;
    const [gridCols, setGridColsState] = useState(state.gridCols);
    const [selectedId, setSelectedId] = useState(null);
    const [liveMessage, setLiveMessage] = useState("");
    const dispatch = useCallback((action) => {
        rawDispatch(action);
        if (action.type === "add") {
            setLiveMessage("Block added");
        }
        else if (action.type === "move") {
            setLiveMessage("Block moved");
        }
        else if (action.type === "resize") {
            setLiveMessage("Block resized");
        }
    }, [rawDispatch]);
    useEffect(() => {
        if (!liveMessage)
            return;
        const t = setTimeout(() => setLiveMessage(""), 500);
        return () => clearTimeout(t);
    }, [liveMessage]);
    useEffect(() => {
        onChange?.(components);
        if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [components, onChange, state, storageKey]);
    useEffect(() => {
        const handler = (e) => {
            if (e.target instanceof HTMLElement &&
                (e.target.tagName === "INPUT" ||
                    e.target.tagName === "TEXTAREA" ||
                    e.target.tagName === "SELECT" ||
                    e.target.isContentEditable)) {
                return;
            }
            if (!(e.ctrlKey || e.metaKey))
                return;
            const k = e.key.toLowerCase();
            if (k === "z") {
                e.preventDefault();
                dispatch({ type: "undo" });
            }
            else if (k === "y") {
                e.preventDefault();
                dispatch({ type: "redo" });
            }
            else if (k === "s") {
                e.preventDefault();
                onSaveShortcut?.();
            }
            else if (k === "p") {
                e.preventDefault();
                onTogglePreview?.();
            }
            else if (k === "[" && e.shiftKey) {
                e.preventDefault();
                onRotateDevice?.("left");
            }
            else if (k === "]" && e.shiftKey) {
                e.preventDefault();
                onRotateDevice?.("right");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [dispatch, onSaveShortcut, onTogglePreview, onRotateDevice]);
    const setGridCols = useCallback((n) => {
        setGridColsState(n);
        dispatch({ type: "set-grid-cols", gridCols: n });
    }, [dispatch]);
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
        gridCols,
        setGridCols,
        liveMessage,
        storageKey,
        clearHistory,
    };
}
export default usePageBuilderState;
