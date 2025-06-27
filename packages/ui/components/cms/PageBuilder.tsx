// packages/ui/components/cms/PageBuilder.tsx
"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  sortableKeyboardCoordinates,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Page, PageComponent } from "@types";
import { memo, useReducer } from "react";
import { ulid } from "ulid";
import { Button } from "../atoms-shim";
import HeroBanner from "../home/HeroBanner";
import ReviewsCarousel from "../home/ReviewsCarousel";
import ValueProps from "../home/ValueProps";

interface Props {
  page: Page;
  onSave(fd: FormData): Promise<unknown>;
  onPublish(fd: FormData): Promise<unknown>;
}

type Action =
  | { type: "add"; component: PageComponent }
  | { type: "move"; from: number; to: number }
  | { type: "remove"; id: string };

function reducer(state: PageComponent[], action: Action): PageComponent[] {
  switch (action.type) {
    case "add":
      return [...state, action.component];
    case "move": {
      if (action.from === action.to) return state;
      const next = arrayMove(state, action.from, action.to);
      return next;
    }
    case "remove":
      return state.filter((b) => b.id !== action.id);
    default:
      return state;
  }
}

const palette: { type: PageComponent["type"]; label: string }[] = [
  { type: "HeroBanner", label: "Hero Banner" },
  { type: "ValueProps", label: "Value Props" },
  { type: "ReviewsCarousel", label: "Reviews Carousel" },
];

function PaletteItem({ type }: { type: PageComponent["type"] }) {
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
}

const Palette = memo(function Palette() {
  return (
    <div className="flex flex-col gap-2">
      {palette.map((p) => (
        <PaletteItem key={p.type} type={p.type} />
      ))}
    </div>
  );
});

function Block({ component }: { component: PageComponent }) {
  switch (component.type) {
    case "HeroBanner":
      return <HeroBanner />;
    case "ValueProps":
      return <ValueProps />;
    case "ReviewsCarousel":
      return <ReviewsCarousel />;
    default:
      return null;
  }
}

const MemoBlock = memo(Block);

function CanvasItem({
  component,
  index,
  onRemove,
}: {
  component: PageComponent;
  index: number;
  onRemove(): void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: component.id,
    data: { from: "canvas", index },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform) }}
      className="relative rounded border"
    >
      <MemoBlock component={component} />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded bg-red-500 px-2 text-xs text-white"
      >
        ×
      </button>
    </div>
  );
}

export default memo(function PageBuilder({ page, onSave, onPublish }: Props) {
  const [components, dispatch] = useReducer(reducer, page.components);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over) return;
    const a = active.data.current as any;
    const o = over.data.current as any;
    if (a?.from === "palette" && over.id === "canvas") {
      const comp: PageComponent = { id: ulid(), type: a.type } as PageComponent;
      dispatch({ type: "add", component: comp });
    } else if (a?.from === "canvas" && o?.from === "canvas") {
      dispatch({ type: "move", from: a.index, to: o.index });
    }
  };

  const formData = new FormData();
  formData.append("id", page.id);
  formData.append("updatedAt", page.updatedAt);
  formData.append("slug", page.slug);
  formData.append("status", page.status);
  formData.append("title", page.seo.title);
  formData.append("description", page.seo.description ?? "");
  formData.append("components", JSON.stringify(components));

  return (
    <div className="flex gap-4">
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
                  onRemove={() => dispatch({ type: "remove", id: c.id })}
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
    </div>
  );
});
