"use client";

import type React from "react";
import { useState } from "react";
import { ulid } from "ulid";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";

interface TemplateNavItem {
  label: string;
  url: string;
  children?: TemplateNavItem[];
}

interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

interface NavTemplate {
  name: string;
  items: TemplateNavItem[];
}

interface Props {
  templates: NavTemplate[];
  onSelect: (items: NavItem[]) => void;
}

function withIds(items: TemplateNavItem[]): NavItem[] {
  return items.map((i) => ({
    id: ulid(),
    label: i.label,
    url: i.url,
    children: i.children ? withIds(i.children) : undefined,
  }));
}

export default function NavTemplateSelector({
  templates,
  onSelect,
}: Props): React.JSX.Element {
  const [value, setValue] = useState("");

  return (
    <div className="flex items-end gap-2">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-full md:w-64">
          <SelectValue placeholder="Navigation preset" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.name} value={t.name}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        disabled={!value}
        onClick={() => {
          const tpl = templates.find((t) => t.name === value);
          if (tpl) onSelect(withIds(tpl.items));
        }}
      >
        Apply
      </Button>
    </div>
  );
}

