"use client";

import { Stack } from "../../../atoms/primitives";
import type { ComponentType } from "../defaults";
import type { PaletteCategoryDefinition } from "../paletteData";
import PaletteItem from "../PaletteItem";
import { isTopLevelAllowed } from "../rules";

interface Props {
  categories: PaletteCategoryDefinition[];
  searchTerm: string;
  onAdd: (type: ComponentType, label: string) => void;
}

export default function CategoriesList({ categories, searchTerm, onAdd }: Props) {
  return (
    <>
      {categories.map(({ id, label, items }) => {
        const filtered = items
          .filter((p) => p.label.toLowerCase().includes(searchTerm))
          .filter((p) => isTopLevelAllowed(p.type));
        if (!filtered.length) return null;
        return (
          <div key={id} className="space-y-2">
            <h4 className="font-semibold capitalize">{label}</h4>
            <Stack gap={2}>
              {filtered.map((p) => (
                <PaletteItem
                  key={p.type}
                  type={p.type}
                  label={p.label}
                  icon={p.icon}
                  description={p.description}
                  previewImage={p.previewImage}
                  onAdd={onAdd}
                />
              ))}
            </Stack>
          </div>
        );
      })}
    </>
  );
}
