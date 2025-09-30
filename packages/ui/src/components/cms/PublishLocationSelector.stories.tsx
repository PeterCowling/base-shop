import type { Meta, StoryObj } from "@storybook/react";
import PublishLocationSelector from "./PublishLocationSelector";

const meta = {
  component: PublishLocationSelector,
  args: {
    selectedIds: [],
    showReload: false,
  },
  argTypes: {
    selectedIds: { control: "object" },
    showReload: { control: "boolean" },
    onChange: { action: "change" },
  },
} satisfies Meta<typeof PublishLocationSelector>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
