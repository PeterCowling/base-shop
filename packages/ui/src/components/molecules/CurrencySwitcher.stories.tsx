import type { Meta, StoryObj } from "@storybook/nextjs";
import CurrencySwitcher from "./CurrencySwitcher.client";

const meta: Meta<typeof CurrencySwitcher> = {
  component: CurrencySwitcher,
  parameters: {
    providers: {
      currency: true,
    },
  },
};
export default meta;

export const Default: StoryObj<typeof CurrencySwitcher> = {};
