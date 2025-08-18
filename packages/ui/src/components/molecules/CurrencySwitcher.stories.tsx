import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import type { Meta, StoryObj } from "@storybook/react";
import CurrencySwitcher from "./CurrencySwitcher.client";

const meta: Meta<typeof CurrencySwitcher> = {
  component: CurrencySwitcher,
  decorators: [
    (Story) => (
      <CurrencyProvider>
        <Story />
      </CurrencyProvider>
    ),
  ],
  args: {},
};
export default meta;

export const Default: StoryObj<typeof CurrencySwitcher> = {};
