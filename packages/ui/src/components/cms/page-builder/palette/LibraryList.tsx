"use client";

import LibraryPaletteItem from "../LibraryPaletteItem";
import type { LibraryItem } from "../libraryStore";
import { Inline, Stack } from "../../../atoms/primitives";

interface Props {
  title: React.ReactNode;
  items: LibraryItem[];
  scope: string | null | undefined; // shop or "_global"
  search: string;
  onDelete: (id: string) => void;
  onToggleShare: (id: string, shared: boolean) => void;
  onUpdate: (id: string, patch: Partial<LibraryItem>) => void;
  shop?: string | null | undefined; // for LibraryPaletteItem optional prop
  headerRight?: React.ReactNode;
}

export default function LibraryList({ title, items, scope: _scope, search, onDelete, onToggleShare, onUpdate, shop, headerRight }: Props) {
  if (items.length === 0) return null;
  const q = search.trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (!q) return true;
    const inLabel = i.label.toLowerCase().includes(q);
    const inTags = (i.tags || []).some((t) => t.toLowerCase().includes(q));
    return inLabel || inTags;
  });
  if (!filtered.length) return null;
  return (
    <div className="space-y-2">
      <Inline className="justify-between" gap={2}>
        <h4 className="font-semibold capitalize">{title}</h4>
        {headerRight}
      </Inline>
      <Stack gap={2}>
        {filtered.map((i) => (
          <LibraryPaletteItem
            key={i.id}
            item={i}
            onDelete={() => onDelete(i.id)}
            onToggleShare={() => onToggleShare(i.id, !i.shared)}
            onUpdate={(patch) => onUpdate(i.id, patch)}
            shop={shop}
          />
        ))}
      </Stack>
    </div>
  );
}
