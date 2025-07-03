// packages/ui/components/cms/NavigationEditor.tsx
"use client";

import { ulid } from "ulid";
import { Button, Input } from "../atoms-shadcn";

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
  return (
    <div className="space-y-2">
      <NavList items={items} onChange={onChange} />
      <Button
        onClick={() =>
          onChange([...items, { id: ulid(), label: "", url: "", children: [] }])
        }
      >
        Add Item
      </Button>
    </div>
  );
}

function NavList({
  items,
  onChange,
  level = 0,
}: {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
  level?: number;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const copy = [...items];
    copy.splice(to, 0, copy.splice(from, 1)[0]);
    onChange(copy);
  };

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

  return (
    <ul className={level ? "ml-4 space-y-2" : "space-y-2"}>
      {items.map((item, i) => (
        <li key={item.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={item.label}
              onChange={(e) => update(i, { ...item, label: e.target.value })}
              placeholder="Label"
            />
            <Input
              value={item.url}
              onChange={(e) => update(i, { ...item, url: e.target.value })}
              placeholder="/path"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => move(i, i - 1)}
            >
              ↑
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => move(i, i + 1)}
            >
              ↓
            </Button>
            <Button size="icon" variant="outline" onClick={() => addChild(i)}>
              +
            </Button>
            <Button size="icon" variant="outline" onClick={() => remove(i)}>
              ✕
            </Button>
          </div>
          {item.children && item.children.length > 0 && (
            <NavList
              items={item.children}
              onChange={(childs) => update(i, { ...item, children: childs })}
              level={level + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
