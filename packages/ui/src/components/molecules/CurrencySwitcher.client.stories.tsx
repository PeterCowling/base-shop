import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import CurrencySwitcher from "./CurrencySwitcher.client";

const meta: Meta<typeof CurrencySwitcher> = {
  title: "Molecules/CurrencySwitcher/Client",
  component: CurrencySwitcher,
  decorators: [
    (Story) => (
      <CurrencyProvider>
        <div className="w-40">
          <Story />
        </div>
      </CurrencyProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CurrencySwitcher>;

export const Default: Story = {};
