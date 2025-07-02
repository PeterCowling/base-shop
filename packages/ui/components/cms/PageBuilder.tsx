// packages/ui/components/cms/PageBuilder.tsx
"use client";

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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Page, PageComponent } from "@types";
import {
  ChangeEvent,
  memo,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { ulid } from "ulid";
import { Button, Input } from "../atoms-shadcn";
import {
  atomRegistry,
  blockRegistry,
  moleculeRegistry,
  organismRegistry,
} from "./blocks";

interface Props {
  page: Page;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  onChange?: (components: PageComponent[]) => void;
  style?: React.CSSProperties;
}

type Action =
  | { type: "add"; component: PageComponent }
  | { type: "move"; from: number; to: number }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; patch: Partial<PageComponent> }
  | { type: "resize"; id: string; width?: string; height?: string };

function reducer(state: PageComponent[], action: Action): PageComponent[] {
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
          ? { ...b, width: action.width, height: action.height }
          : b
      );
    default:
      return state;
  }
}

const palette = {
  atoms: (Object.keys(atomRegistry) as PageComponent["type"][]).map((t) => ({
    type: t,
    label: t.replace(/([A-Z])/g, " $1").trim(),
  })),
  molecules: (Object.keys(moleculeRegistry) as PageComponent["type"][]).map(
    (t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
    })
  ),
  organisms: (Object.keys(organismRegistry) as PageComponent["type"][]).map(
    (t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
    })
  ),
} as const;

const PaletteItem = memo(function PaletteItem({
  type,
}: {
  type: PageComponent["type"];
}) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: type,
    data: { from: "palette", type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform) }}
      className="cursor-grab rounded border p-2 text-center text-sm"
    >
      {type}
    </div>
  );
});

const Palette = memo(function Palette() {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(palette).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h4 className="font-semibold capitalize">{category}</h4>
          <div className="flex flex-col gap-2">
            {items.map((p) => (
              <PaletteItem key={p.type} type={p.type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

function Block({ component }: { component: PageComponent }) {
  const Comp = blockRegistry[component.type];
  if (!Comp) return null;
  const { id, type, ...props } = component as any;
  return <Comp {...props} />;
}

const MemoBlock = memo(Block);

function ComponentEditor({
  component,
  onChange,
}: {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}) {
  if (!component) return null;

  const handleInput = (field: string, value: string | number | undefined) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  const arrayEditor = (
    prop: string,
    items: any[] | undefined,
    fields: string[]
  ) => {
    const list = items ?? [];
    return (
      <div className="space-y-2">
        {list.map((item, idx) => (
          <div key={idx} className="space-y-1 rounded border p-2">
            {fields.map((f) => (
              <Input
                key={f}
                value={item[f] ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const next = [...list];
                  next[idx] = { ...next[idx], [f]: e.target.value };
                  onChange({ [prop]: next } as Partial<PageComponent>);
                }}
                placeholder={f}
              />
            ))}
            <Button
              variant="destructive"
              onClick={() => {
                const next = list.filter((_, i) => i !== idx);
                onChange({ [prop]: next } as Partial<PageComponent>);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          onClick={() => {
            const next = [
              ...list,
              Object.fromEntries(fields.map((f) => [f, ""])),
            ];
            onChange({ [prop]: next } as Partial<PageComponent>);
          }}
        >
          Add
        </Button>
      </div>
    );
  };

  let specific: React.ReactNode = null;

  switch (component.type) {
    case "ContactForm":
      specific = (
        <div className="space-y-2">
          <Input
            label="Action"
            value={(component as any).action ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInput("action", e.target.value)
            }
          />
          <Input
            label="Method"
            value={(component as any).method ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInput("method", e.target.value)
            }
          />
        </div>
      );
      break;
    case "Gallery":
      specific = arrayEditor("images", (component as any).images, [
        "src",
        "alt",
      ]);
      break;
    case "Testimonials":
      specific = arrayEditor("testimonials", (component as any).testimonials, [
        "quote",
        "name",
      ]);

      break;
    case "HeroBanner":
      return arrayEditor("slides", (component as any).slides, [
        "src",
        "alt",
        "headlineKey",
        "ctaKey",
      ]);
      break;
    case "ValueProps":
      specific = arrayEditor("items", (component as any).items, [
        "icon",
        "title",
        "desc",
      ]);
      break;
    case "ReviewsCarousel":
      specific = arrayEditor("reviews", (component as any).reviews, [
        "nameKey",
        "quoteKey",
      ]);
      break;
    default:
      specific = <p className="text-sm text-gray-500">No editable props</p>;
  }

  return (
    <div className="space-y-2">
      <Input
        label="Width"
        value={component.width ?? ""}
        onChange={(e) => handleInput("width", e.target.value)}
      />
      <Input
        label="Height"
        value={component.height ?? ""}
        onChange={(e) => handleInput("height", e.target.value)}
      />
      {specific}
    </div>
  );
}

const CanvasItem = memo(function CanvasItem({
  component,
  index,
  onRemove,
  selected,
  onSelect,
  dispatch,
}: {
  component: PageComponent;
  index: number;
  onRemove: () => void;
  selected: boolean;
  onSelect: () => void;
  dispatch: React.Dispatch<Action>;
}) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: component.id,
    data: { from: "canvas", index },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number; w: number; h: number }>();
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      dispatch({
        type: "resize",
        id: component.id,
        width: `${startRef.current.w + dx}px`,
        height: `${startRef.current.h + dy}px`,
      });
    };
    const stop = () => setResizing(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [resizing, component.id, dispatch]);

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
    setResizing(true);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      style={{
        transform: CSS.Transform.toString(transform),
        ...(component.width ? { width: component.width } : {}),
        ...(component.height ? { height: component.height } : {}),
      }}
      className={
        "relative rounded border" + (selected ? " ring-2 ring-blue-500" : "")
      }
    >
      <MemoBlock component={component} />
      {selected && (
        <>
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-blue-500"
          />
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-blue-500"
          />
          <div
            onPointerDown={startResize}
            className="absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-blue-500"
          />
          <div
            onPointerDown={startResize}
            className="absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-blue-500"
          />
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded bg-red-500 px-2 text-xs text-white"
      >
        ×
      </button>
    </div>
  );
});

export default memo(function PageBuilder({
  page,
  onSave,
  onPublish,
  onChange,
  style,
}: Props) {
  const [components, dispatch] = useReducer(reducer, page.components);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    onChange?.(components);
  }, [components, onChange]);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={components.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div id="canvas" className="flex flex-col gap-4">
              {components.map((c, i) => (
                <CanvasItem
                  key={c.id}
                  component={c}
                  index={i}
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
