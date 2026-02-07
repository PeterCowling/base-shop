"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { useState } from "react";
import clsx from "clsx";

import { Button } from "@acme/design-system/primitives";

import { Inline, Stack } from "@/components/ui/flex";

import { TextInput } from "../components/FormFields";
import { RichTextEditor } from "../components/RichTextEditor";
import type { TabProps } from "../types";

type Section = {
  id?: string;
  title?: string;
  body?: unknown[];
};

type SectionCardProps = {
  section: Section;
  index: number;
  totalCount: number;
  onUpdate: (updates: Partial<Section>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function SectionCard({
  section,
  index,
  totalCount,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-brand-outline/30 bg-brand-surface p-4">
      <Inline className="justify-between">
        <Inline className="gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-brand-text/60 hover:text-brand-text"
          >
            <svg
              className={clsx("h-4 w-4 transition-transform", expanded && "rotate-90")}
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4L10 8L6 12" />
            </svg>
          </button>
          <span className="font-semibold text-brand-heading">
            {section.title || `Section ${index + 1}`}
          </span>
          {section.id && (
            <span className="text-xs text-brand-text/50">#{section.id}</span>
          )}
        </Inline>
        <Inline className="gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded px-2 py-1 text-xs text-brand-text/60 hover:bg-brand-surface hover:text-brand-text disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className="rounded px-2 py-1 text-xs text-brand-text/60 hover:bg-brand-surface hover:text-brand-text disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded px-2 py-1 text-xs text-brand-terra hover:bg-brand-terra/10"
            title="Remove section"
          >
            ×
          </button>
        </Inline>
      </Inline>
      {expanded && (
        <Stack className="mt-4 gap-4">
          <TextInput
            label="Section ID"
            value={section.id ?? ""}
            onChange={(v) => onUpdate({ id: v || undefined })}
            placeholder="e.g., getting-started"
            hint="Used for anchor links (optional)"
          />
          <TextInput
            label="Title"
            value={section.title ?? ""}
            onChange={(v) => onUpdate({ title: v || undefined })}
            placeholder="Section heading"
          />
          <RichTextEditor
            fieldId={`sections.${index}.body`}
            label="Body"
            value={section.body}
            onChange={(next) => onUpdate({ body: next })}
            placeholder="Section content..."
            allowedFormats={["bold", "italic", "bulletList", "link"]}
            hint="Separate paragraphs with blank lines"
          />
        </Stack>
      )}
    </div>
  );
}

export default function SectionsTab({ content, updateField }: TabProps) {
  const sections = (content.sections ?? []) as Section[];

  const addSection = () => {
    updateField("sections", [...sections, { id: "", title: "", body: [] }]);
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updates };
    updateField("sections", updated);
  };

  const removeSection = (index: number) => {
    updateField(
      "sections",
      sections.filter((_, i) => i !== index),
    );
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updateField("sections", updated);
  };

  return (
    <Stack className="gap-4">
      <p className="text-xs text-brand-text/60">
        Content sections appear in order on the guide page. Use the arrows to reorder.
      </p>

      {sections.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-brand-outline/30 p-8 text-center">
          <p className="text-sm text-brand-text/60">No sections yet</p>
          <p className="mt-1 text-xs text-brand-text/40">
            Add a section to start building your guide content
          </p>
        </div>
      ) : (
        sections.map((section, index) => (
          <SectionCard
            key={section.id || `section-${index}`}
            section={section}
            index={index}
            totalCount={sections.length}
            onUpdate={(updates) => updateSection(index, updates)}
            onRemove={() => removeSection(index)}
            onMoveUp={() => moveSection(index, index - 1)}
            onMoveDown={() => moveSection(index, index + 1)}
          />
        ))
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="h-10 rounded-lg border-brand-outline/40 text-sm text-brand-text"
      >
        + Add section
      </Button>
    </Stack>
  );
}
