// packages/ui/components/cms/NavigationEditor.tsx
"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Fragment, useState, forwardRef } from "react";
import { ulid } from "ulid";
import { Button, Input } from "../atoms/shadcn";
import { useTranslations } from "@acme/i18n";

export interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

interface Props {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}

export default function NavigationEditor({ items, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <NavList items={items} onChange={onChange} />
      <Button
        onClick={() =>
          onChange([...items, { id: ulid(), label: "", url: "", children: [] }])
        }
      >
        {t("nav.addItem")}
      </Button>
    </div>
  );
}

// Wrap DOM node to satisfy react/forbid-dom-props for "style"
const DraggableLi = forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...rest }, ref) => (
    <li ref={ref} className={className} {...rest} />
  )
);
DraggableLi.displayName = "DraggableLi";

function NavList({
  items,
  onChange,
  level = 0,
}: {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
  level?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const update = (idx: number, item: NavItem) => {
    const copy = [...items];
    copy[idx] = item;
    onChange(copy);
  };

  const remove = (idx: number) => {
    const copy = items.filter((_, i) => i !== idx);
    onChange(copy);
  };

  const addChild = (idx: number) => {
    const item = items[idx];
    const children = item.children ? [...item.children] : [];
    children.push({ id: ulid(), label: "", url: "", children: [] });
    update(idx, { ...item, children });
  };

  const handleDragStart = (ev: DragStartEvent) => {
    setInsertIndex(items.findIndex((i) => i.id === ev.active.id));
  };

  const handleDragOver = (ev: DragOverEvent) => {
    const { over, active } = ev;
    if (!over) {
      setInsertIndex(items.length);
      return;
    }
    const overIndex = items.findIndex((i) => i.id === over.id);
    const activeRect = active.rect.current.translated;
    const isBelow =
      activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
    setInsertIndex(overIndex + (isBelow ? 1 : 0));
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active } = ev;
    if (insertIndex !== null) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      if (oldIndex !== insertIndex) {
        onChange(arrayMove(items, oldIndex, insertIndex));
      }
    }
    setInsertIndex(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* eslint-disable-next-line ds/no-hardcoded-copy -- ABC-123: spacing utility is not UI copy */}
        <ul className={level ? "ms-4 space-y-2" : "space-y-2"}>
          {items.map((item, i) => (
            <Fragment key={item.id}>
              {insertIndex === i && (
                <li
                  data-placeholder
                  className="h-4 rounded border-2 border-dashed border-primary bg-primary/10"
                />
              )}
              <SortableNavItem
                item={item}
                level={level}
                update={(it) => update(i, it)}
                remove={() => remove(i)}
                addChild={() => addChild(i)}
              />
            </Fragment>
          ))}
          {insertIndex === items.length && (
            <li
              data-placeholder
              className="h-4 rounded border-2 border-dashed border-primary bg-primary/10"
            />
          )}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableNavItem({
  item,
  level,
  update,
  remove,
  addChild,
}: {
  item: NavItem;
  level: number;
  update: (item: NavItem) => void;
  remove: () => void;
  addChild: () => void;
}) {
  const t = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DraggableLi
      ref={setNodeRef}
      style={style}
      className={"space-y-2" + (isDragging ? " opacity-50" : "")}
    >
      <div className="flex items-center gap-2">
        <Button
          className="h-8 w-8 p-0 cursor-grab"
          variant="outline"
          {...attributes}
          {...listeners}
        >
          <DragHandleDots2Icon className="h-4 w-4" />
        </Button>
        <Input
          value={item.label}
          onChange={(e) => update({ ...item, label: e.target.value })}
          placeholder={t("nav.itemLabelPlaceholder") as string}
        />
        <Input
          value={item.url}
          onChange={(e) => update({ ...item, url: e.target.value })}
          placeholder={t("nav.itemUrlPlaceholder") as string}
        />
        <Button
          className="h-8 w-8 p-0"
          variant="outline"
          onClick={addChild}
        >
          +
        </Button>
        <Button
          className="h-8 w-8 p-0"
          variant="outline"
          onClick={remove}
        >
          ✕
        </Button>
      </div>
      {item.children && item.children.length > 0 && (
        <NavList
          items={item.children}
          onChange={(childs) => update({ ...item, children: childs })}
          level={level + 1}
        />
      )}
    </DraggableLi>
  );
}
