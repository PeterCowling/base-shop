import type { Meta, StoryObj } from "@storybook/nextjs";
import { DeliveryScheduler } from "./DeliveryScheduler";

const meta: Meta<typeof DeliveryScheduler> = {
  title: "Organisms/DeliveryScheduler",
  component: DeliveryScheduler,
  args: {
    regions: ["Zone 1", "Zone 2"],
    windows: ["10-11", "11-12", "12-13"],
  },
};
export default meta;

export const Default: StoryObj<typeof DeliveryScheduler> = {};
