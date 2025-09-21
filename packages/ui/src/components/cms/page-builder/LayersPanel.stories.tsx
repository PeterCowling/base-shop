// packages/ui/src/components/cms/page-builder/LayersPanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import LayersPanel from "./LayersPanel";
import type { PageComponent } from "@acme/types";
import { moveComponent } from "./state/layout/utils";

const meta: Meta<typeof LayersPanel> = {
  title: "CMS/Page Builder/LayersPanel",
  component: LayersPanel,
};
export default meta;

type Story = StoryObj<typeof LayersPanel>;

const sample: PageComponent[] = [
  {
    id: "hero",
    type: "Section" as any,
    name: "Hero",
    children: [
      { id: "headline", type: "Text" as any, name: "Headline" },
      { id: "cta", type: "Button" as any, name: "CTA" },
    ],
  } as any,
  { id: "gallery", type: "Gallery" as any, name: "Gallery" } as any,
];

export const Basic: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    const [editor, setEditor] = useState<Record<string, any>>({});
    return (
      <div style={{ width: 360 }}>
        <LayersPanel
          components={sample}
          selectedIds={selected}
          onSelectIds={setSelected}
          dispatch={(action: any) => {
            if (action.type === "update-editor") {
              setEditor((e) => ({ ...e, [action.id]: { ...(e[action.id] ?? {}), ...(action.patch ?? {}) } }));
            }
            // eslint-disable-next-line no-console
            console.log("dispatch", action);
          }}
          editor={editor as any}
          viewport="desktop"
        />
      </div>
    );
  },
};

export const DragAndDrop: Story = {
  name: "Drag & Drop",
  render: () => {
    const [components, setComponents] = useState<PageComponent[]>([
      {
        id: "hero",
        type: "Section" as any,
        name: "Hero",
        children: [
          { id: "headline", type: "Text" as any, name: "Headline" },
          { id: "cta", type: "Button" as any, name: "CTA" },
        ],
      } as any,
      { id: "gallery", type: "Gallery" as any, name: "Gallery" } as any,
      { id: "footer", type: "Section" as any, name: "Footer", children: [] } as any,
    ]);
    const [selected, setSelected] = useState<string[]>([]);
    const [editor, setEditor] = useState<Record<string, any>>({});
    return (
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
        <div>
          <LayersPanel
            components={components}
            selectedIds={selected}
            onSelectIds={setSelected}
            dispatch={(action: any) => {
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
              // eslint-disable-next-line no-console
              console.log("dispatch", action);
            }}
            editor={editor as any}
            viewport="desktop"
          />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted-foreground)' }}>Drag rows to reorder or nest under parents.</p>
          <pre style={{ marginTop: 8, fontSize: 12 }}>{JSON.stringify(components, null, 2)}</pre>
        </div>
      </div>
    );
  },
};
