"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { Button } from "@acme/design-system/primitives";

import { Inline, Stack } from "@/components/ui/flex";

import { TextInput } from "../components/FormFields";
import type { TabProps } from "../types";

type GalleryItem = {
  alt?: string;
  caption?: string;
};

type Gallery = {
  title?: string;
  items?: GalleryItem[];
};

type GalleryItemCardProps = {
  item: GalleryItem;
  index: number;
  onUpdate: (updates: Partial<GalleryItem>) => void;
  onRemove: () => void;
};

function GalleryItemCard({ item, index, onUpdate, onRemove }: GalleryItemCardProps) {
  return (
    <div className="rounded-lg border border-brand-outline/30 bg-brand-surface p-4">
      <Inline className="mb-3 justify-between">
        <span className="text-xs font-semibold text-brand-text/60">Image #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-brand-terra hover:underline"
        >
          Remove
        </button>
      </Inline>
      <Stack className="gap-3">
        <TextInput
          label="Alt text"
          value={item.alt ?? ""}
          onChange={(v) => onUpdate({ alt: v || undefined })}
          placeholder="Describe the image for accessibility"
          hint="Required for SEO and screen readers"
        />
        <TextInput
          label="Caption"
          value={item.caption ?? ""}
          onChange={(v) => onUpdate({ caption: v || undefined })}
          placeholder="Optional caption shown below image"
        />
      </Stack>
    </div>
  );
}

export default function GalleryTab({ content, updateField }: TabProps) {
  const gallery = (content.gallery ?? { title: "", items: [] }) as Gallery;
  const items = gallery.items ?? [];

  const updateGallery = (updates: Partial<Gallery>) => {
    updateField("gallery", { ...gallery, ...updates });
  };

  const addItem = () => {
    updateGallery({ items: [...items, { alt: "", caption: "" }] });
  };

  const updateItem = (index: number, updates: Partial<GalleryItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...updates };
    updateGallery({ items: updated });
  };

  const removeItem = (index: number) => {
    updateGallery({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <Stack className="gap-4">
      <p className="text-xs text-brand-text/60">
        Gallery image metadata. Image paths are configured in the manifest.
      </p>

      <TextInput
        label="Gallery title"
        value={gallery.title ?? ""}
        onChange={(v) => updateGallery({ title: v || undefined })}
        placeholder="Photo gallery"
        hint="Heading shown above the gallery"
      />

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <GalleryItemCard
            key={`gallery-${index}`}
            item={item}
            index={index}
            onUpdate={(updates) => updateItem(index, updates)}
            onRemove={() => removeItem(index)}
          />
        ))}

        <button
          type="button"
          onClick={addItem}
          className="flex min-h-32 items-center justify-center rounded-lg border-2 border-dashed border-brand-outline/40 p-8 text-brand-text/60 hover:border-brand-primary/60 hover:text-brand-primary"
        >
          + Add image metadata
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-center text-xs text-brand-text/40">
          No gallery items. Add image alt text and captions here.
        </p>
      )}
    </Stack>
  );
}
