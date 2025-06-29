import type { Meta, StoryObj } from "@storybook/react";
import PublishLocationSelector from "./PublishLocationSelector";

const meta: Meta<typeof PublishLocationSelector> = {
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
};
export default meta;

export const Default: StoryObj<typeof PublishLocationSelector> = {};
