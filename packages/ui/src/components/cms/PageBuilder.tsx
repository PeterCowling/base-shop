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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Page, PageComponent, HistoryState } from "@types";
import { pageComponentSchema } from "@types";
import type { CSSProperties } from "react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
  "Section",
] as const;

type ComponentType = (typeof COMPONENT_TYPES)[number];

const CONTAINER_TYPES = ["Section"] as const;

/* ════════════════ external contracts ════════════════ */
interface Props {
  page: Page;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  onChange?: (components: PageComponent[]) => void;
  style?: CSSProperties;
}

/* ════════════════ runtime validation (Zod) ════════════════ */
export const historyStateSchema: z.ZodType<HistoryState> = z
  .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
  })
  .default({ past: [], present: [], future: [] });

/* ════════════════ reducers ════════════════ */
type ChangeAction =
  | {
      type: "add";
      component: PageComponent;
      parentId?: string;
      index?: number;
    }
  | {
      type: "move";
      from: { parentId?: string; index: number };
      to: { parentId?: string; index: number };
    }
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

function addAt(list: PageComponent[], index: number, item: PageComponent) {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

function addComponent(
  list: PageComponent[],
  parentId: string | undefined,
  index: number | undefined,
  component: PageComponent
): PageComponent[] {
  if (!parentId) {
    return addAt(list, index ?? list.length, component);
  }
  return list.map((c) => {
    if (c.id === parentId && "children" in c) {
      const children = addAt(
        (c.children ?? []) as PageComponent[],
        index ?? (c.children?.length ?? 0),
        component
      );
      return { ...c, children } as PageComponent;
    }
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: addComponent(c.children, parentId, index, component) } as PageComponent;
    }
    return c;
  });
}

function removeComponent(list: PageComponent[], id: string): PageComponent[] {
  return list
    .map((c) =>
      "children" in c && Array.isArray(c.children)
        ? { ...c, children: removeComponent(c.children, id) } as PageComponent
        : c
    )
    .filter((c) => c.id !== id);
}

function updateComponent(
  list: PageComponent[],
  id: string,
  patch: Partial<PageComponent>
): PageComponent[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch } as PageComponent;
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: updateComponent(c.children, id, patch) } as PageComponent;
    }
    return c;
  });
}

function resizeComponent(
  list: PageComponent[],
  id: string,
  patch: { width?: string; height?: string; left?: string; top?: string }
): PageComponent[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch } as PageComponent;
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: resizeComponent(c.children, id, patch) } as PageComponent;
    }
    return c;
  });
}

function extractComponent(
  list: PageComponent[],
  parentId: string | undefined,
  index: number
): [PageComponent | null, PageComponent[]] {
  if (!parentId) {
    const item = list[index];
    const rest = [...list.slice(0, index), ...list.slice(index + 1)];
    return [item, rest];
  }
  let removed: PageComponent | null = null;
  const newList = list.map((c) => {
    if (removed) return c;
    if (c.id === parentId && "children" in c) {
      const childList = (c.children ?? []) as PageComponent[];
      const item = childList[index];
      removed = item ?? null;
      const rest = [...childList.slice(0, index), ...childList.slice(index + 1)];
      return { ...c, children: rest } as PageComponent;
    }
    if ("children" in c && Array.isArray(c.children)) {
      const [item, rest] = extractComponent(c.children, parentId, index);
      if (item) {
        removed = item;
        return { ...c, children: rest } as PageComponent;
      }
    }
    return c;
  });
  return [removed, newList];
}

function moveComponent(
  list: PageComponent[],
  from: { parentId?: string; index: number },
  to: { parentId?: string; index: number }
): PageComponent[] {
  const [item, without] = extractComponent(list, from.parentId, from.index);
  if (!item) return list;
  return addComponent(without, to.parentId, to.index, item);
}

function componentsReducer(
  state: PageComponent[],
  action: ChangeAction
): PageComponent[] {
  switch (action.type) {
    case "add":
      return addComponent(state, action.parentId, action.index, action.component);
    case "move":
      return moveComponent(state, action.from, action.to);
    case "remove":
      return removeComponent(state, action.id);
    case "update":
      return updateComponent(state, action.id, action.patch);
    case "resize":
      return resizeComponent(state, action.id, {
        width: action.width,
        height: action.height,
        left: action.left,
        top: action.top,
      });
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

// Placeholder constant for reducer tests to strip component code
const palette = {};

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
  const migrate = useCallback(
    (comps: PageComponent[]): PageComponent[] =>
      comps.map((c) =>
        c.type === "Section"
          ? { ...c, children: c.children ?? [] }
          : c
      ),
    []
  );

  const [state, dispatch] = useReducer(reducer, undefined, (): HistoryState => {
    const initial = migrate(page.components as PageComponent[]);
    if (typeof window === "undefined") {
      return { past: [], present: initial, future: [] };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) throw new Error("no stored state");
      const parsed = historyStateSchema.parse(JSON.parse(stored));
      return { ...parsed, present: migrate(parsed.present) };
    } catch (err) {
      console.warn("Failed to parse stored page builder state", err);
      return { past: [], present: initial, future: [] };
    }
  });

  const components = state.present;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [publishCount, setPublishCount] = useState(0);
  const prevId = useRef(page.id);

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
        parentId?: string;
      };
      const o = (over.data.current || {}) as {
        parentId?: string;
        index?: number;
      };

      const findById = (list: PageComponent[], id: string): PageComponent | null => {
        for (const c of list) {
          if (c.id === id) return c;
          if ((c as any).children) {
            const found = findById((c as any).children, id);
            if (found) return found;
          }
        }
        return null;
      };

      let parentId = o.parentId;
      let index = o.index;
      if (over.id === "canvas") {
        parentId = undefined;
        index = components.length;
      } else if (parentId === undefined) {
        parentId = over.id.toString().replace(/^container-/, "");
        const parent = findById(components, parentId);
        index = ((parent as any)?.children?.length ?? 0) as number;
      }

      if (a?.from === "palette") {
        const isContainer = CONTAINER_TYPES.includes(a.type! as any);
        const component = {
          id: ulid(),
          type: a.type! as ComponentType,
          ...(isContainer ? { children: [] } : {}),
        } as PageComponent;
        dispatch({
          type: "add",
          component,
          parentId,
          index: index ?? 0,
        });
      } else if (a?.from === "canvas") {
        let toIndex = index ?? 0;
        if (a.parentId === parentId && a.index! < (index ?? 0)) {
          toIndex = (index ?? 0) - 1;
        }
        dispatch({
          type: "move",
          from: { parentId: a.parentId, index: a.index! },
          to: { parentId, index: toIndex },
        });
      }
    },
    [dispatch, components]
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
    fd.append("history", JSON.stringify(state));
    return fd;
  }, [page, components, state]);

  const handlePublish = useCallback(() => {
    return onPublish(formData).then(() => setPublishCount((c) => c + 1));
  }, [onPublish, formData]);

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
                  parentId={undefined}
                  selectedId={selectedId}
                  onSelectId={setSelectedId}
                  onRemove={() => dispatch({ type: "remove", id: c.id })}
                  dispatch={dispatch}
                  locale={locale}
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
          <Button variant="outline" onClick={handlePublish}>
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
