import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import type { Meta, StoryObj } from "@storybook/react";
import CurrencySwitcher from "./CurrencySwitcher.client";

const meta = {
  component: CurrencySwitcher,
  decorators: [
    (Story) => (
      <CurrencyProvider>
        <Story />
      </CurrencyProvider>
    ),
  ],
  args: {},
} satisfies Meta<typeof CurrencySwitcher>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
