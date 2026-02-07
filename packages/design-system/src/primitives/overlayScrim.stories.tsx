import type { Meta, StoryObj } from "@storybook/react";

import { OverlayScrim } from "./overlayScrim";

const meta: Meta<typeof OverlayScrim> = {
  title: "Atoms/Primitives/OverlayScrim",
  component: OverlayScrim,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof OverlayScrim>;

export const Default: Story = {
  render: () => (
    <div className="relative h-screen bg-muted">
      <OverlayScrim />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">Underlying content</div>
      </div>
    </div>
  ),
};
