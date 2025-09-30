// packages/ui/src/components/cms/page-builder/OverlayPicker.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import OverlayPicker from "./OverlayPicker";

const meta = {
  title: "CMS/Page Builder/OverlayPicker",
  component: OverlayPicker,
  parameters: {
    docs: {
      description: {
        component: "Interactive picker for gradient/overlay backgrounds with live preview.",
      },
    },
  },
} satisfies Meta<typeof OverlayPicker>;
export default meta;

type Story = StoryObj<typeof meta>;



function PlaygroundStory() {
  const [value, setValue] = useState<string | undefined>(
    "linear-gradient(135deg, rgba(0,0,0,.45), rgba(0,0,0,0))",
  );
  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line react/forbid-dom-props -- PB-2419: story preview needs dynamic inline background */}
      <div className="h-24 w-full rounded-md border" style={{ background: value }} />
      <OverlayPicker value={value} onChange={setValue} />
    </div>
  );
}

export const Playground = {
  render: () => <PlaygroundStory />,
} satisfies Story;
