import type { Meta, StoryObj } from "@storybook/react";
import { DeliveryScheduler } from "./DeliveryScheduler";

const meta = {
  component: DeliveryScheduler,
  args: {
    regions: ["Zone 1", "Zone 2"],
    windows: ["10-11", "11-12", "12-13"],
  },
} satisfies Meta<typeof DeliveryScheduler>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
