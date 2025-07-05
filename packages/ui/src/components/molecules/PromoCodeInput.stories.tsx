import type { Meta, StoryObj } from "@storybook/react";
import { PromoCodeInput } from "./PromoCodeInput";

const meta: Meta<typeof PromoCodeInput> = {
  component: PromoCodeInput,
  args: {
    loading: false,
  },
  argTypes: {
    onApply: { action: "apply" },
  },
};
export default meta;

export const Default: StoryObj<typeof PromoCodeInput> = {};
