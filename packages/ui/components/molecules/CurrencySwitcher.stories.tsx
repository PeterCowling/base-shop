import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyProvider } from "../../../platform-core/contexts/CurrencyContext";
import CurrencySwitcher from "./CurrencySwitcher";

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
