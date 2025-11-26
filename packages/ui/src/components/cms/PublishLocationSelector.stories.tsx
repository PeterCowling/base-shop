import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import PublishLocationSelector from "./PublishLocationSelector";

const meta: Meta<typeof PublishLocationSelector> = {
  component: PublishLocationSelector,
  args: {
    selectedIds: [],
    showReload: false,
    onChange: fn(),
  },
  argTypes: {
    selectedIds: { control: "object" },
    showReload: { control: "boolean" },
  },
};
export default meta;

export const Default: StoryObj<typeof PublishLocationSelector> = {};
