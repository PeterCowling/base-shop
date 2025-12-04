import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import PublishLocationSelector from "./PublishLocationSelector";

const meta: Meta<typeof PublishLocationSelector> = {
  title: "CMS/PublishLocationSelector",
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
