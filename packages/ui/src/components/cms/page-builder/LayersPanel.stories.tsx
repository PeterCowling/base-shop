// packages/ui/src/components/cms/page-builder/LayersPanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
import LayersPanel from "./LayersPanel";
import type { PageComponent, EditorFlags } from "@acme/types";
import { moveComponent } from "./state/layout/utils";

const meta: Meta<typeof LayersPanel> = {
  title: "CMS/Page Builder/LayersPanel",
  component: LayersPanel,
  parameters: {
    docs: {
      description: {
        component: "Tree view for page components with drag-and-drop reordering and editor flag controls.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof LayersPanel>;

const sample: PageComponent[] = [
  {
    id: "hero",
    type: "Section" as unknown as PageComponent["type"],
    name: "Hero",
    children: [
      { id: "headline", type: "Text" as unknown as PageComponent["type"], name: "Headline" },
      { id: "cta", type: "Button" as unknown as PageComponent["type"], name: "CTA" },
    ],
  } as unknown as PageComponent,
  { id: "gallery", type: "Gallery" as unknown as PageComponent["type"], name: "Gallery" } as unknown as PageComponent,
];

type Action =
  | { type: "update-editor"; id: string; patch?: Partial<EditorFlags> }
  | { type: "move"; from: number[]; to: number[] }
  | { type: string; [k: string]: unknown };

export const Basic: Story = {
  render: () => {
    const Example = () => {
      const [selected, setSelected] = useState<string[]>([]);
      const [editor, setEditor] = useState<Record<string, EditorFlags>>({});
      return (
        <div className="w-96">
          <LayersPanel
            components={sample}
            selectedIds={selected}
            onSelectIds={setSelected}
            dispatch={(action: Action) => {
              if (action.type === "update-editor") {
                setEditor((e) => ({ ...e, [action.id]: { ...(e[action.id] ?? {}), ...(action.patch ?? {}) } }));
              }
              console.warn("dispatch", action);
            }}
            editor={editor}
            viewport="desktop"
          />
        </div>
      );
    };
    return <Example />;
  },
};

export const DragAndDrop: Story = {
  name: "Drag & Drop",
  render: () => {
    const Example = () => {
      const [components, setComponents] = useState<PageComponent[]>([
        {
          id: "hero",
          type: "Section" as unknown as PageComponent["type"],
          name: "Hero",
          children: [
            { id: "headline", type: "Text" as unknown as PageComponent["type"], name: "Headline" },
            { id: "cta", type: "Button" as unknown as PageComponent["type"], name: "CTA" },
          ],
        } as unknown as PageComponent,
        { id: "gallery", type: "Gallery" as unknown as PageComponent["type"], name: "Gallery" } as unknown as PageComponent,
        { id: "footer", type: "Section" as unknown as PageComponent["type"], name: "Footer", children: [] } as unknown as PageComponent,
      ]);
      const [selected, setSelected] = useState<string[]>([]);
      const [editor, setEditor] = useState<Record<string, EditorFlags>>({});
      return (
        <div className="flex gap-4">
          <div className="w-96 shrink-0">
            <LayersPanel
              components={components}
              selectedIds={selected}
              onSelectIds={setSelected}
              dispatch={(action: Action) => {
                if (action.type === "move") {
                  setComponents((prev) => moveComponent(prev, action.from, action.to));
                  return;
                }
                if (action.type === "update-editor") {
                  setEditor((e) => ({
                    ...e,
                    [action.id]: { ...(e[action.id] ?? {}), ...(action.patch ?? {}) },
                  }));
                  return;
                }
                console.warn("dispatch", action);
              }}
              editor={editor}
              viewport="desktop"
            />
          </div>
          <div>
            <p className="m-0 text-xs text-muted-foreground">Drag rows to reorder or nest under parents.</p>
            <pre className="mt-2 text-xs">{JSON.stringify(components, null, 2)}</pre>
          </div>
        </div>
      );
    };
    return <Example />;
  },
};
