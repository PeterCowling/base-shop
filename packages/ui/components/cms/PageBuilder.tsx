// packages/ui/components/cms/PageBuilder.tsx
"use client";

import { locales, type Locale } from "@/i18n/locales";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Page, PageComponent } from "@types";
import { memo, useEffect, useReducer, useState } from "react";
import { ulid } from "ulid";
import { z } from "zod";
import { Button } from "../atoms-shadcn";
import CanvasItem from "./page-builder/CanvasItem";
import ComponentEditor from "./page-builder/ComponentEditor";
import Palette from "./page-builder/Palette";

interface Props {
  page: Page;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  onChange?: (components: PageComponent[]) => void;
  style?: React.CSSProperties;
}

export interface HistoryState {
  past: PageComponent[][];
  present: PageComponent[];
  future: PageComponent[][];
}

export const historyStateSchema: z.ZodSchema<HistoryState> = z.object({
  past: z.array(z.array(z.any())),
  present: z.array(z.any()),
  future: z.array(z.array(z.any())),
});

type ChangeAction =
  | { type: "add"; component: PageComponent }
  | { type: "move"; from: number; to: number }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; patch: Partial<PageComponent> }
  | {
      type: "resize";
      id: string;
      width?: string;
      height?: string;
      left?: string;
      top?: string;
    }
  | { type: "set"; components: PageComponent[] };

export type Action = ChangeAction | { type: "undo" } | { type: "redo" };

function componentsReducer(
  state: PageComponent[],
  action: ChangeAction
): PageComponent[] {
  switch (action.type) {
    case "add":
      return [...state, action.component];
    case "move":
      if (action.from === action.to) return state;
      return arrayMove(state, action.from, action.to);
    case "remove":
      return state.filter((b) => b.id !== action.id);
    case "update":
      return state.map((b) =>
        b.id === action.id ? { ...b, ...action.patch } : b
      );
    case "resize":
      return state.map((b) =>
        b.id === action.id
          ? {
              ...b,
              width: action.width,
              height: action.height,
              left: action.left,
              top: action.top,
            }
          : b
      );
    case "set":
      return action.components;
    default:
      return state;
  }
}

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    default: {
      const next = componentsReducer(state.present, action);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: [],
      };
    }
  }
}

export default memo(function PageBuilder({
  page,
  onSave,
  onPublish,
  onChange,
  style,
}: Props) {
  const key = `page-builder-history-${page.id}`;
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return historyStateSchema.parse(JSON.parse(stored));
        } catch (err) {
          console.warn("Invalid history state", err);
        }
      }
    }
    return { past: [], present: page.components, future: [] } as HistoryState;
  });
  const components = state.present;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [locale, setLocale] = useState<Locale>("en");

  const widthMap: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const containerStyle = { width: widthMap[viewport] };

  useEffect(() => {
    onChange?.(components);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [components, onChange, state, key]);

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
  }, []);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over) return;

    const a = active.data.current as {
      from: string;
      type?: string;
      index?: number;
    };
    const o = over.data.current as { from: string; index?: number };

    if (a?.from === "palette" && over.id === "canvas") {
      dispatch({
        type: "add",
        component: { id: ulid(), type: a.type! } as PageComponent,
      });
    } else if (a?.from === "canvas" && o?.from === "canvas") {
      dispatch({ type: "move", from: a.index!, to: o.index! });
    }
  };

  const formData = new FormData();
  formData.append("id", page.id);
  formData.append("updatedAt", page.updatedAt);
  formData.append("slug", page.slug);
  formData.append("status", page.status);
  formData.append("title", JSON.stringify(page.seo.title));
  formData.append("description", JSON.stringify(page.seo.description ?? {}));
  formData.append("components", JSON.stringify(components));

  return (
    <div className="flex gap-4" style={style}>
      <aside className="w-48 shrink-0">
        <Palette />
      </aside>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant={viewport === "desktop" ? "default" : "outline"}
            onClick={() => setViewport("desktop")}
          >
            Desktop
          </Button>
          <Button
            size="sm"
            variant={viewport === "tablet" ? "default" : "outline"}
            onClick={() => setViewport("tablet")}
          >
            Tablet
          </Button>
          <Button
            size="sm"
            variant={viewport === "mobile" ? "default" : "outline"}
            onClick={() => setViewport("mobile")}
          >
            Mobile
          </Button>
        </div>
        <div className="flex justify-end gap-2">
          {locales.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={locale === l ? "default" : "outline"}
              onClick={() => setLocale(l)}
            >
              {l.toUpperCase()}
            </Button>
          ))}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={components.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div
              id="canvas"
              style={containerStyle}
              className="mx-auto flex flex-col gap-4 rounded border"
            >
              {" "}
              {components.map((c, i) => (
                <CanvasItem
                  key={c.id}
                  component={c}
                  index={i}
                  locale={locale}
                  selected={c.id === selectedId}
                  onSelect={() => setSelectedId(c.id)}
                  onRemove={() => dispatch({ type: "remove", id: c.id })}
                  dispatch={dispatch}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Button
            onClick={() => dispatch({ type: "undo" })}
            disabled={!state.past.length}
          >
            Undo
          </Button>
          <Button
            onClick={() => dispatch({ type: "redo" })}
            disabled={!state.future.length}
          >
            Redo
          </Button>
          <Button onClick={() => onSave(formData)}>Save</Button>
          <Button variant="outline" onClick={() => onPublish(formData)}>
            Publish
          </Button>
        </div>
      </div>
      {selectedId && (
        <aside className="w-72 shrink-0">
          <ComponentEditor
            component={components.find((c) => c.id === selectedId)!}
            onChange={(patch) =>
              dispatch({ type: "update", id: selectedId, patch })
            }
          />
        </aside>
      )}
    </div>
  );
});
