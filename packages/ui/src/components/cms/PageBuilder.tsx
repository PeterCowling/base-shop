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
import type { CSSProperties } from "react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { ulid } from "ulid";
import { z } from "zod";
import { Button } from "../atoms-shadcn";
import CanvasItem from "./page-builder/CanvasItem";
import ComponentEditor from "./page-builder/ComponentEditor";
import Palette from "./page-builder/Palette";

/* ════════════════ component catalogue ════════════════ */
const COMPONENT_TYPES = [
  "HeroBanner",
  "ValueProps",
  "ReviewsCarousel",
  "ProductGrid",
  "Gallery",
  "ContactForm",
  "ContactFormWithMap",
  "BlogListing",
  "Testimonials",
  "TestimonialSlider",
  "Image",
  "Text",
] as const;

type ComponentType = (typeof COMPONENT_TYPES)[number];

/**
 *  Trick for Zod / TS: give `z.enum()` a statically-sized tuple.
 *  `as const` → readonly array  ⟶ spread into a tuple literal.
 */
const COMPONENT_TYPE_TUPLE = [...COMPONENT_TYPES] as [
  ComponentType,
  ...ComponentType[],
];

/* ════════════════ external contracts ════════════════ */
interface Props {
  page: Page;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  onChange?: (components: PageComponent[]) => void;
  style?: CSSProperties;
}

export interface HistoryState {
  past: PageComponent[][];
  present: PageComponent[];
  future: PageComponent[][];
}

/* ════════════════ runtime validation (Zod) ════════════════ */
const pageComponentSchema: z.ZodType<PageComponent> = z
  .object({
    id: z.string(),
    type: z.enum(COMPONENT_TYPE_TUPLE),
    width: z.string().optional(),
    height: z.string().optional(),
    left: z.string().optional(),
    top: z.string().optional(),
  })
  .passthrough();

/**
 *  Build → default → cast; the cast is safe because the default value
 *  fully satisfies the `HistoryState` contract.
 */
export const historyStateSchema = z
  .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
  })
  .default({
    past: [],
    present: [],
    future: [],
  }) as unknown as z.ZodType<HistoryState>;

/* ════════════════ reducers ════════════════ */
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
      return action.from === action.to
        ? state
        : arrayMove(state, action.from, action.to);
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
      const previous = state.past.at(-1);
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
      const next = componentsReducer(state.present, action as ChangeAction);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: [],
      };
    }
  }
}

/* ════════════════ component ════════════════ */
const PageBuilder = memo(function PageBuilder({
  page,
  onSave,
  onPublish,
  onChange,
  style,
}: Props) {
  /* ── state initialise / persistence ───────────────────────────── */
  const storageKey = `page-builder-history-${page.id}`;
  const [state, dispatch] = useReducer(reducer, undefined, (): HistoryState => {
    if (typeof window === "undefined") {
      return {
        past: [],
        present: page.components as PageComponent[],
        future: [],
      };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) throw new Error("no stored state");
      return historyStateSchema.parse(JSON.parse(stored));
    } catch {
      return {
        past: [],
        present: page.components as PageComponent[],
        future: [],
      };
    }
  });

  const components = state.present;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [locale, setLocale] = useState<Locale>("en");

  /* ── derived memo values ──────────────────────────────────────── */
  const widthMap = useMemo(
    () =>
      ({
        desktop: "100%",
        tablet: "768px",
        mobile: "375px",
      }) as const,
    []
  );

  const containerStyle = useMemo(
    () => ({ width: widthMap[viewport] }),
    [viewport, widthMap]
  );

  /* ── side-effects ─────────────────────────────────────────────── */
  useEffect(() => {
    onChange?.(components);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [components, onChange, state, storageKey]);

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

  /* ── dnd sensors / handler ────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (ev: DragEndEvent): void => {
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
          component: {
            id: ulid(),
            type: a.type! as ComponentType,
          } as PageComponent,
        });
      } else if (a?.from === "canvas" && o?.from === "canvas") {
        dispatch({ type: "move", from: a.index!, to: o.index! });
      }
    },
    [dispatch]
  );

  /* ── form-data builder ────────────────────────────────────────── */
  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append("id", page.id);
    fd.append("updatedAt", page.updatedAt);
    fd.append("slug", page.slug);
    fd.append("status", page.status);
    fd.append("title", JSON.stringify(page.seo.title));
    fd.append("description", JSON.stringify(page.seo.description ?? {}));
    fd.append("components", JSON.stringify(components));
    return fd;
  }, [page, components]);

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="flex gap-4" style={style}>
      {/* Palette */}
      <aside className="w-48 shrink-0">
        <Palette />
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col gap-4">
        {/* viewport buttons */}
        <div className="flex justify-end gap-2">
          {(["desktop", "tablet", "mobile"] as const).map((v) => (
            <Button
              key={v}
              variant={viewport === v ? "default" : "outline"}
              onClick={() => setViewport(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>

        {/* locale buttons */}
        <div className="flex justify-end gap-2">
          {locales.map((l) => (
            <Button
              key={l}
              variant={locale === l ? "default" : "outline"}
              onClick={() => setLocale(l)}
            >
              {l.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Canvas */}
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

        {/* action buttons */}
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

      {/* Component editor */}
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

export default PageBuilder;
