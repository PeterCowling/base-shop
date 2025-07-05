import type { Meta, StoryObj } from "@storybook/react";
import { QuantityInput } from "./QuantityInput";

const meta: Meta<typeof QuantityInput> = {
  component: QuantityInput,
  args: {
    value: 1,
    min: 1,
    max: 5,
  },
  argTypes: {
    onChange: { action: "change" },
  },
};
export default meta;

export const Default: StoryObj<typeof QuantityInput> = {};
